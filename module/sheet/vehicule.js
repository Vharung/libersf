const ActorSheetV2 = foundry.applications.sheets.ActorSheetV2;
const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
import LiberChat from "../document/chat.js";

/* ==========================================================================
 *  RÈGLES DES VÉHICULES : version « paliers » + pièces + rôles d'équipage
 *
 *  Champs optionnels à ajouter au modèle de données du véhicule
 *  (valeurs par défaut gérées si absents) :
 *    - anciennete   (String)  Prototype | Neuf | Standard | Usage | Vetuste
 *    - iaActive     (Boolean) true par défaut ; false = IA désactivée
 *    - iaPlus / iaMoins (String) spécialisation d'IA : pilotage | mecanique | piratage | visee
 *
 *  Champ de force : palier de base = palier du moteur - 2 (minimum 0), +1 palier par pièce
 *  « Générateur de champ de force » (2 maximum). Cette pièce n'existe que sur les vaisseaux Mère
 *  équipés d'un moteur Warp (P8) ; le champ ne dépasse jamais le palier du moteur.
 *
 *  Rôles d'équipage : stockés dans le flag  flags.libersf.roles = { idUtilisateur: ["pilote", ...] }
 *  Le MJ attribue les rôles (bouton « Équipage »). Un joueur peut en avoir plusieurs.
 *  Chaque joueur ne voit que les actions de ses postes ; seuls le MJ et le mécanicien voient l'énergie.
 *
 *  Actions à bord et coûts d'énergie : voir ACTIONS.
 * ========================================================================== */

const PALIER_MAX = 8;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** "Quartiers d'équipage" -> "quartiers-d-equipage" */
const slug = (s) => String(s ?? "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Emplacements occupés par un objet de véhicule (arme ou pièce hors catalogue).
 * Ordre : flags.libersf.emplacements (compendium) > system.emplacements > 2 si arme lourde > 1.
 */
const empItem = (item) => Number(
  item.flags?.libersf?.emplacements
  ?? item.system?.emplacements
  ?? ((item.flags?.libersf?.lourd || item.system?.lourd) ? 2 : 1)
);

/** Anciens modèles M1…M10 convertis en paliers P0…P8 (index = numéro M). */
const M_VERS_PALIER = {
  ia:       [null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 8], // Supérieure et Quasi-consciente fusionnent
  moteur:   [null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 8], // Propulsion furtive devient un module
  blindage: [null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 8]  // Blindage énergétique absorbé par le champ de force
};

/** Accepte "M7" (ancien format) ou "P6" (nouveau format). */
function versPalier(valeur, genre) {
  const s = String(valeur ?? "").trim().toUpperCase();
  const n = parseInt(s.replace(/\D/g, ""), 10);
  if (!Number.isFinite(n)) return 0;
  if (s.startsWith("P")) return clamp(n, 0, PALIER_MAX);
  return M_VERS_PALIER[genre][clamp(n, 1, 10)];
}

/** P0 = ★, P1 = ★☆, P2 = ★★ … P8 = ★★★★★ (la demi-étoile garde le glyphe ✬ de la feuille). */
function etoiles(p) {
  p = clamp(Math.floor(p), 0, PALIER_MAX);
  return "<span>★</span>".repeat(1 + Math.floor(p / 2)) + (p % 2 ? "<span>✬</span>" : "");
}

/**
 * Bonus donné au joueur à un poste, même formule que « techno » dans actor.js :
 *   techno = parseInt(valeur - 2) * 5 || 0   ->   P2 = 0, P3 = +5, P4 = +10 … P8 = +30, P0 = -10.
 */
const bonusEtoiles = (p) => (Math.floor(p) - 2) * 5 || 0;
const signe = (n) => (n > 0 ? "+" : "") + n;

/** Étoiles suivies, en dessous, de la valeur du bonus (affiché sous le rappel d'étoiles de la feuille). */
const etoilesBonus = (p) => `${etoiles(p)}<br><small class="bonus-stat">${signe(bonusEtoiles(clamp(p, 0, PALIER_MAX)))}</small>`;

const TAILLES = { Leger: 1, Moyen: 2, Lourd: 3, Meres: 4, Mere: 4 };
const NOMS_TAILLE = ["", "Léger", "Moyen", "Lourd", "Mère"];

/**
 * État du véhicule.
 *  palier : modificateur appliqué aux 4 statistiques
 *  prix   : coefficient de prix
 *  critR  : points ajoutés à la zone de réussite critique (5 -> 5 + critR)
 *  critE  : points ajoutés à la zone d'échec critique (95 -> 95 - critE)
 */
const ANCIENNETE = {
  prototype: { palier: +2, prix: 2,   critR: 10, critE: 0 },
  neuf:      { palier: +1, prix: 1.5, critR: 5,  critE: 0 },
  standard:  { palier: 0,  prix: 1,   critR: 0,  critE: 0 },
  usage:     { palier: -1, prix: 0.6, critR: 0,  critE: 5 },
  vetuste:   { palier: -2, prix: 0.3, critR: 0,  critE: 10 }
};

/** Seuils de base du d100 : réussite critique <= 5, échec critique > 95. */
const CRITIQUE_BASE = 5;
const ECHEC_BASE = 95;

/**
 * Actions à bord, par poste. Une action = { name (data-name), nom, cout (en % d'énergie), effet, ... } avec en option :
 *  arme: n        -> coût = énergie des n armes choisies + cout (tir, tir ciblé, saturation)
 *  horsCombat     -> aucune énergie, action de repos
 *  soin: f        -> rend f x PV de coque max
 *  convertir      -> {pv, nrj} : retire pv x PV de coque max et ajoute nrj % d'énergie
 */
const ACTIONS = [
  { id: "pilote", titre: "Pilote (Pilotage)", liste: [
    { name: "evasive", nom: "Manœuvre évasive", cout: 20, effet: "-20 pour toucher le véhicule jusqu'au prochain tour. Fait perdre la prochaine action." },
    { name: "pique", nom: "Attaque en piqué / charge", cout: 10, effet: "+20 pour toucher, dégâts ×2. -20 en défense au tour suivant." },
    { name: "leurre", nom: "Déploiement de leurres", cout: 5, effet: "Chaque tir ennemi doit réussir un jet de chance (50 %) ou est détourné. 1 tour." },
    { name: "assistance", nom: "Assistance de tir", cout: 5, effet: "+15 pour toucher à l'artilleur." },
    { name: "invisible", nom: "Escamotage / furtivité", cout: 15, effet: "Un jet de détection est nécessaire pour le trouver." },
    { name: "tactique", nom: "Survol tactique", cout: 5, effet: "+10 aux jets de détection de l'équipage." },
    { name: "sprint", nom: "Sprint", cout: 25, effet: "Déplacement doublé, permet de fuir." },
    { name: "pivoter", nom: "Pivoter", cout: 5, effet: "Expose le secteur de son choix à l'ennemi." }
  ] },
  { id: "artilleur", titre: "Artilleur (Visée / Tir)", liste: [
    { name: "tir", nom: "Tir", cout: 0, arme: 1, effet: "Attaque classique." },
    { name: "cible", nom: "Tir ciblé", cout: 5, arme: 1, effet: "-20 pour toucher, vise un secteur ou un système précis." },
    { name: "saturation", nom: "Tir de saturation", cout: 10, arme: 2, effet: "Deux armes sur la même cible, +10 pour toucher, aucune autre action ce tour." },
    { name: "verrouillage", nom: "Verrouillage", cout: 5, effet: "La cible est marquée : +10 pour toucher pour tous les tirs de l'équipage." }
  ] },
  { id: "mecanicien", titre: "Mécanicien (Mécanique)", liste: [
    { name: "equilibrage", nom: "Rééquilibrage du champ", cout: 0, effet: "Déplace les points entre secteurs. Obligatoire en fin de tour." },
    { name: "repair", nom: "Réparation d'urgence", cout: 15, soin: 0.10, effet: "Rend 10 % des PV de coque. Une fois par combat." },
    { name: "surcharge", nom: "Surcharge du moteur", cout: 0, convertir: { pv: 0.10, nrj: 20 }, effet: "Convertit 10 % de PV de coque en 20 % d'énergie." },
    { name: "redemarrage", nom: "Redémarrage", cout: 15, effet: "Remet en marche un véhicule en panne." },
    { name: "blindage", nom: "Réparation du blindage", cout: 0, horsCombat: true, effet: "Nécessite un kit de réparation d'armure." }
  ] },
  { id: "operateur", titre: "Opérateur (Piratage)", liste: [
    { name: "sabotage", nom: "Sabotage", cout: 20, effet: "Test opposé contre le Piratage ennemi : désactive son champ de force 1 tour." },
    { name: "abordage", nom: "Abordage", cout: 40, effet: "Téléportation à bord de l'ennemi, sauf défenses internes. Test opposé, -20 si l'ennemi a un champ actif." },
    { name: "detection", nom: "Détection", cout: 5, effet: "Repère les ennemis, informations tactiques." },
    { name: "brouillage", nom: "Brouillage", cout: 10, effet: "Les tirs ennemis subissent -10 pour toucher pendant 1 tour." },
    { name: "communication", nom: "Communication", cout: 5, effet: "Coordination avec les alliés." }
  ] },
  { id: "capitaine", titre: "Médecin / capitaine", liste: [
    { name: "medic", nom: "Support médical", cout: 10, effet: "Premiers soins à l'équipage." },
    { name: "urgence", nom: "Urgence", cout: 10, soin: 0.05, effet: "Éteint les incendies, rend 5 % des PV de coque." },
    { name: "commandement", nom: "Commandement", cout: 0, effet: "" }
  ] }
];

/** Icônes Font Awesome (incluses dans Foundry) des boutons d'action. */
const ICONES = {
  evasive: "fa-shuffle", pique: "fa-jet-fighter-up", leurre: "fa-burst", assistance: "fa-crosshairs", invisible: "fa-user-secret",
  tactique: "fa-binoculars", sprint: "fa-gauge-high", pivoter: "fa-rotate",
  tir: "fa-bullseye", cible: "fa-location-crosshairs", saturation: "fa-explosion", verrouillage: "fa-lock",
  equilibrage: "fa-scale-balanced", repair: "fa-wrench", surcharge: "fa-bolt", redemarrage: "fa-power-off", blindage: "fa-shield-halved",
  sabotage: "fa-bomb", abordage: "fa-person-rifle", detection: "fa-satellite-dish", brouillage: "fa-wave-square", communication: "fa-tower-broadcast",
  medic: "fa-kit-medical", urgence: "fa-fire-extinguisher", commandement: "fa-star"
};
const trouverAction = (name) => ACTIONS.flatMap(r => r.liste).find(a => a.name === name);
const coutTexte = (a) => a.arme ? (a.cout ? `arme + ${a.cout} %` : "arme") : a.horsCombat ? "hors combat" : a.cout ? `${a.cout} %` : "gratuit";

/* ==========================================================================
 *  RÔLES D'ÉQUIPAGE
 * ========================================================================== */

/** Rôles = les ids des postes de ACTIONS (pilote, artilleur, mecanicien, operateur, capitaine). */
const ROLES = ACTIONS.map(r => ({ id: r.id, titre: r.titre }));

/** Rôles d'un utilisateur sur ce véhicule. Le MJ a tous les rôles. */
const getRoles = (actor, user = game.user) => {
  if (user.isGM) return new Set(ROLES.map(r => r.id));
  return new Set(actor.getFlag("libersf", "roles")?.[user.id] ?? []);
};

/** Seuls le MJ et le mécanicien voient l'énergie. */
const voitEnergie = (actor, user = game.user) => user.isGM || getRoles(actor, user).has("mecanicien");

/** Poste (id de ACTIONS) auquel appartient une action. */
const roleDeAction = (name) => ACTIONS.find(r => r.liste.some(a => a.name === name))?.id;

/** Dialogue du MJ : cases à cocher joueur x rôle. */
async function gererEquipage(actor) {
  const actuels = actor.getFlag("libersf", "roles") ?? {};
  const joueurs = game.users.filter(u => !u.isGM);
  if (!joueurs.length) return ui.notifications.warn("Aucun joueur.");

  const entete = ROLES.map(r => `<th>${r.titre.replace(/\s*\(.*\)/, "")}</th>`).join("");
  const lignes = joueurs.map(u => `<tr><td>${u.name}</td>` + ROLES.map(r =>
    `<td style="text-align:center"><input type="checkbox" data-user="${u.id}" data-role="${r.id}" ${(actuels[u.id] ?? []).includes(r.id) ? "checked" : ""}></td>`
  ).join("") + `</tr>`).join("");

  const res = await DialogV2.prompt({
    window: { title: `Équipage : ${actor.name}`, resizable: true },
    position: { width: 720 },
    content: `<table style="width:100%"><thead><tr><th></th>${entete}</tr></thead><tbody>${lignes}</tbody></table>`,
    rejectClose: false,
    ok: {
      label: "Valider",
      callback: (ev, btn) => {
        const out = Object.fromEntries(joueurs.map(u => [u.id, []]));
        btn.form.querySelectorAll("input[type=checkbox]:checked").forEach(i => out[i.dataset.user].push(i.dataset.role));
        return out;
      }
    }
  });
  if (res) await actor.update({ "flags.libersf.roles": res });
}

/* ========================================================================== */

/** Énergie (en %) consommée par un tir d'une arme de véhicule. Champ à adapter à votre modèle d'objet. */
const coutArme = (item) => Number(item.flags?.libersf?.energie ?? item.system?.energie ?? 0) || 0;

/** Demande à l'utilisateur de choisir n arme(s) du véhicule. Retourne les objets ou null (annulé). */
async function choisirArmes(actor, n) {
  const armes = actor.items.filter(i => i.type === "weaponvehicule");
  if (!armes.length) { ui.notifications.warn("Ce véhicule n'a aucune arme."); return null; }
  const voulu = Math.min(n, armes.length);
  const type = n > 1 ? "checkbox" : "radio";
  const content = `<p>Choisir ${voulu} arme${voulu > 1 ? "s" : ""} :</p>` + armes.map((a, k) =>
    `<label style="display:block"><input type="${type}" name="arme" value="${a.id}" ${n === 1 && k === 0 ? "checked" : ""}> ${a.name} (${coutArme(a)} %)</label>`).join("");
  const ids = await DialogV2.prompt({
    window: { title: "Choix de l'arme" }, content, rejectClose: false,
    ok: { label: "Valider", callback: (ev, btn) => [...btn.form.querySelectorAll('input[name="arme"]:checked')].map(i => i.value) }
  });
  if (!ids) return null;
  if (ids.length !== voulu) { ui.notifications.warn(`Il faut choisir exactement ${voulu} arme(s).`); return null; }
  return ids.map(id => actor.items.get(id));
}

/** Compétence de la feuille -> statistique du véhicule (à adapter à vos clés). */
const STAT_PAR_COMPETENCE = {
  pilotage: "pilotage", pilote: "pilotage",
  mecanique: "mecanique", mecanicien: "mecanique",
  piratage: "piratage", hacking: "piratage",
  visee: "visee", tir: "visee"
};

/**
 * Catalogue des pièces (items de type "room").
 * L'objet est reconnu par flags.libersf.piece, sinon par le slug de son nom.
 * min = taille minimale (1 Léger, 2 Moyen, 3 Lourd, 4 Mère) selon le type ; 0 = impossible.
 */
const PIECES = {
  "soute":                   { emp: 1, prix: 1000, max: 3, min: { Space: 1, Terre: 1, Mer: 1, Air: 1 } },
  "generateur-de-champ-de-force": { emp: 2, prix: 3000, max: 2, min: { Space: 4, Terre: 4, Mer: 4, Air: 4 }, moteurMin: 8 }, // Mère uniquement, moteur Warp (P8) uniquement
  "generateur-auxiliaire":   { emp: 1, prix: 2000, max: 2, min: { Space: 1, Terre: 1, Mer: 1, Air: 1 } },
  "capsule-de-sauvetage":    { emp: 1, prix: 1500, max: 1, min: { Space: 1, Terre: 0, Mer: 2, Air: 2 } },
  "generateur-de-furtivite": { emp: 2, prix: 4000, max: 1, min: { Space: 1, Terre: 0, Mer: 2, Air: 1 } }, // Mer : sous-marin
  "quartiers-d-equipage":    { emp: 1, prix: 1500, max: 3, min: { Space: 2, Terre: 3, Mer: 2, Air: 3 } },
  "infirmerie":              { emp: 1, prix: 2500, max: 1, min: { Space: 2, Terre: 3, Mer: 2, Air: 2 } },
  "atelier":                 { emp: 1, prix: 2500, max: 1, min: { Space: 2, Terre: 2, Mer: 2, Air: 3 } },
  "laboratoire":             { emp: 2, prix: 4000, max: 1, min: { Space: 2, Terre: 3, Mer: 3, Air: 3 } },
  "cellules":                { emp: 1, prix: 1500, max: 3, min: { Space: 2, Terre: 2, Mer: 2, Air: 3 } },
  "defenses-internes":       { emp: 1, prix: 3000, max: 1, min: { Space: 2, Terre: 2, Mer: 2, Air: 2 } },
  "sas":                     { emp: 1, prix: 2000, max: 1, min: { Space: 2, Terre: 0, Mer: 3, Air: 0 } }, // Mer : sous-marin
  "centre-de-commandement":  { emp: 2, prix: 5000, max: 1, min: { Space: 3, Terre: 3, Mer: 3, Air: 3 } },
  "hangar":                  { emp: 3, prix: 8000, max: 1, min: { Space: 3, Terre: 4, Mer: 3, Air: 3 } }
};

/**
 * Calcule toutes les caractéristiques dérivées d'un véhicule (sans effet de bord).
 * Utilisée par la feuille, par les jets et par le contexte du template.
 */
function calculerVehicule(actor) {
  const sys = actor.system;
  const type = sys.typevehicule;
  const nbtaille = TAILLES[sys.taillevehicule] ?? 1;
  const anc = ANCIENNETE[slug(sys.anciennete)] ?? ANCIENNETE.standard;
  const alertes = [];

  // --- Paliers des composants ---
  const pIA = versPalier(sys.modeleIA, "ia");
  const pMoteur = versPalier(sys.modeleMoteur, "moteur");
  const pBlindage = versPalier(sys.modeleBlindage, "blindage");

  // --- Statistiques (en paliers), IA désactivée = P IA à 0 ---
  const iaActive = sys.iaActive !== false;
  const iaEff = iaActive ? pIA : 0;
  const base = {
    pilotage: Math.floor((iaEff + pMoteur) / 2),
    mecanique: pMoteur,
    piratage: iaEff,
    visee: iaEff
  };
  if (iaActive) { // spécialisation : +1 / -1
    if (sys.iaPlus in base) base[sys.iaPlus] += 1;
    if (sys.iaMoins in base) base[sys.iaMoins] -= 1;
  }
  const stats = {};
  const bonus = {};
  for (const [k, v] of Object.entries(base)) {
    stats[k] = clamp(v + anc.palier, 0, PALIER_MAX);
    bonus[k] = bonusEtoiles(stats[k]);
  }
  const techno = Math.floor((pIA + pMoteur) / 2);

  // --- Pièces et armes ---
  const items = actor.items.toObject();
  let empUtilises = 0, prixPieces = 0, armesUtil = 0, prixArmes = 0;
  const compte = {};

  for (const item of items) {
    const qty = Number(item.system?.quantity ?? 1);
    if (item.type === "weaponvehicule") {
      const emp = empItem(item);
      armesUtil += emp * qty;
      prixArmes += (item.system?.valeur || 0) * qty;
    } else if (item.type === "room") {
      const cle = item.flags?.libersf?.piece ?? slug(item.name);
      const def = PIECES[cle];
      if (def) {
        empUtilises += def.emp * qty;
        prixPieces += def.prix * nbtaille * qty;
        compte[cle] = (compte[cle] || 0) + qty;
        const mini = def.min[type];
        if (!mini) {
          alertes.push(`${item.name} : impossible sur un véhicule de ce type.`);
        } else if (nbtaille < mini) {
          alertes.push(`${item.name} : taille minimale « ${NOMS_TAILLE[mini]} » pour ce type de véhicule.`);
        }
        if (def.moteurMin && pMoteur < def.moteurMin) {
          alertes.push(`${item.name} : réservé aux moteurs Warp.`);
        }
      } else {
        empUtilises += empItem(item) * qty;
        prixPieces += (item.system?.valeur || 0) * qty;
      }
    }
  }
  for (const [cle, n] of Object.entries(compte)) {
    if (n > PIECES[cle].max) alertes.push(`${cle} : maximum ${PIECES[cle].max} par véhicule.`);
  }

  // --- Champ de force : base = moteur - 2, +1 par générateur, plafonné au palier du moteur ---
  const defGen = PIECES["generateur-de-champ-de-force"];
  const nbGenChamp = pMoteur >= defGen.moteurMin ? (compte["generateur-de-champ-de-force"] || 0) : 0;
  const pChampBase = Math.max(0, pMoteur - 2);
  const pChamp = Math.min(pMoteur, pChampBase + nbGenChamp);
  if (pChampBase + nbGenChamp > pMoteur) {
    alertes.push("Le champ de force ne peut pas dépasser le palier du moteur : un générateur de champ est inutile.");
  }

  // --- Défenses, coque, énergie ---
  const armormax = (pBlindage + 1) * 100 * nbtaille;
  const shieldmax = (pChamp + 1) * 100 * nbtaille;
  const healthmax = 200 * nbtaille * nbtaille;
  const armeMax = 2 * nbtaille;
  const pieceMax = 10 * nbtaille;
  const regen = 10 + 5 * pMoteur + 10 * (compte["generateur-auxiliaire"] || 0);

  // --- Vérifications ---
  if (empUtilises > pieceMax) alertes.push(`Trop de pièces : ${empUtilises} emplacements utilisés sur ${pieceMax}.`);
  if (armesUtil > armeMax) alertes.push(`Trop d'armes : ${armesUtil} emplacements utilisés sur ${armeMax}.`);
  if (pMoteur === PALIER_MAX && (type !== "Space" || nbtaille < 2)) {
    alertes.push("Le moteur Warp n'équipe que les vaisseaux spatiaux de taille Moyen ou plus.");
  }

  // --- Prix : base de taille + composants (le champ de base est inclus avec le moteur), x ancienneté, + armes et pièces ---
  const composant = (p) => Math.pow(p + 1, 2) * 100 * nbtaille;
  const prixCoque = 20000 * nbtaille + composant(pMoteur) + composant(pBlindage) + composant(pIA) + composant(pChampBase);
  const prix = Math.round(prixCoque + prixArmes + prixPieces) * anc.prix;

  return {
    type, nbtaille,
    paliers: { ia: pIA, moteur: pMoteur, blindage: pBlindage, champ: pChamp },
    stats, bonus, techno, regen,
    critique: CRITIQUE_BASE + anc.critR, // réussite critique si jet <= critique
    echecCrit: ECHEC_BASE - anc.critE,   // échec critique si jet > echecCrit
    armormax, shieldmax, healthmax, encmax: 100,
    armeMax, pieceMax, armesUtil, empUtilises,
    prix, alertes
  };
}

/**
 * Vérifie qu'un objet peut être ajouté à un véhicule.
 * Retourne un message d'erreur (refus) ou null (ajout autorisé).
 *  - pièce : type/taille compatibles, maximum par pièce, emplacements restants
 *  - arme de véhicule : emplacements d'armes restants
 * Ne fait rien si l'acteur n'est pas un véhicule.
 */
function verifierAjout(actor, item) {
  if (!actor?.system || actor.system.taillevehicule === undefined) return null;
  if (item.type !== "weaponvehicule" && item.type !== "room") return null;

  const r = calculerVehicule(actor);
  const qty = Number(item.system?.quantity ?? 1);

  if (item.type === "weaponvehicule") {
    const emp = empItem(item) * qty;
    if (r.armesUtil + emp > r.armeMax) {
      return `${item.name} : plus assez d'emplacements d'armes (${r.armesUtil} / ${r.armeMax}).`;
    }
    return null;
  }

  const cle = item.flags?.libersf?.piece ?? slug(item.name);
  const def = PIECES[cle];
  const emp = (def ? def.emp : empItem(item)) * qty;

  if (def) {
    const mini = def.min[r.type];
    if (!mini) return `${item.name} est impossible sur un véhicule de ce type.`;
    if (r.nbtaille < mini) {
      return `${item.name} demande un véhicule de taille « ${NOMS_TAILLE[mini]} » ou plus pour ce type.`;
    }
    const deja = actor.items
      .filter(i => i.type === "room" && (i.flags?.libersf?.piece ?? slug(i.name)) === cle)
      .reduce((n, i) => n + Number(i.system?.quantity ?? 1), 0);
    if (deja + qty > def.max) {
      return `${item.name} : maximum ${def.max} par véhicule.`;
    }
    if (def.moteurMin && r.paliers.moteur < def.moteurMin) {
      return `${item.name} est réservé aux véhicules équipés d'un moteur Warp.`;
    }
    if (cle === "generateur-de-champ-de-force" && Math.max(0, r.paliers.moteur - 2) + deja + qty > r.paliers.moteur) {
      return `${item.name} : le champ de force a déjà atteint le palier du moteur.`;
    }
  }
  if (r.empUtilises + emp > r.pieceMax) {
    return `${item.name} : plus assez d'emplacements de pièces (${r.empUtilises} / ${r.pieceMax}).`;
  }
  return null;
}

/**
 * Début de tour d'un véhicule (bouton « Nouveau tour » ou tour de combat automatique) :
 *  - énergie : + regen (10 % + 5 % par palier de moteur + 10 % par générateur auxiliaire)
 *  - champ de force : +10 % de son maximum s'il n'a pas été touché au tour précédent
 */
async function debutDeTour(actor) {
  const sys = actor.system;
  const r = calculerVehicule(actor);
  const nrj = Math.min(r.encmax, (Number(sys.enc) || 0) + r.regen);
  const update = { "system.enc": nrj };

  const touche = await DialogV2.confirm({
    window: { title: `Nouveau tour : ${actor.name}` },
    content: "<p>Le champ de force a-t-il été touché au tour précédent ?</p>",
    yes: { label: "Oui" },
    no: { label: "Non" }
  });

  let infoChamp = "";
  if (touche === false) {
    const actuel = ["haut", "droite", "bas", "gauche"].reduce((n, k) => n + (Number(sys[k]) || 0), 0);
    const gain = Math.min(Math.round(r.shieldmax * 0.10), Math.max(0, r.shieldmax - actuel));
    const parSecteur = Math.floor(gain / 4);
    for (const k of ["haut", "droite", "bas", "gauche"]) update[`system.${k}`] = (Number(sys[k]) || 0) + parSecteur;
    infoChamp = ` · Champ de force +${parSecteur * 4}`;
  }

  const chat = await new LiberChat(actor)
    .withTemplate("systems/libersf/templates/chat/roll-dammage.hbs")
    .withContent("rollDamage")
    .withData({
      actingCharName: actor.name,
      actingCharImg: actor.img,
      introText: "",
      infoarme: "Nouveau tour",
      color: "var(--couleur-bleuelect)",
      succes: `Énergie +${r.regen} %${infoChamp}`
    })
    .create();
  await chat.display();
  await actor.update(update);
}

/** Gestion de la feuille de véhicule */

export default class LiberVehiculeSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["liber", "actor", "character"],
    position: { width: 500, height: 900 },
    form: { submitOnChange: true },
    window: { resizable: true },
    dragDrop: [{ dragSelector: '[data-drag]', dropSelector: '.inventory-list' }], // Remplacer '.inventory-list' par votre sélecteur
    actions: {
      editImage: LiberVehiculeSheet.#onEditImage,
      edit: LiberVehiculeSheet.#onItemEdit,
      delete: LiberVehiculeSheet.#onItemDelete,
      rollSave: LiberVehiculeSheet.#onItemRollSave,
      rollDamage: LiberVehiculeSheet.#onItemRollDamage,
      filtre: LiberVehiculeSheet.#onFiltre,
      filtrev: LiberVehiculeSheet.#onFiltres,
      equip: LiberVehiculeSheet.#onItemEquip,
      desequip: LiberVehiculeSheet.#onItemDesequip,
      fulldown: LiberVehiculeSheet.#onFullDown,
      newTurn: LiberVehiculeSheet.#onNewTurn,
      equipage: LiberVehiculeSheet.#onEquipage // NOUVEAU : le MJ attribue les rôles
    }
  };

  /** @override */
  static PARTS = {
    header: { template: "systems/libersf/templates/actors/vehicule-header.hbs" },
    tabs: { template: "systems/libersf/templates/actors/character-navigation.hbs" },
    stat: { template: "systems/libersf/templates/actors/vehicule-stat.hbs" },
    actions: { template: "systems/libersf/templates/actors/vehicule-actions.hbs" },
    biography: { template: "systems/libersf/templates/actors/vehicule-biography.hbs" },
    inventory: { template: "systems/libersf/templates/actors/vehicule-inventory.hbs" },
    soute: { template: "systems/libersf/templates/actors/vehicule-soute.hbs" }
  };


  /** Gestion des onglets */
  #getTabs() {
    const tabs = {
      config: { id: "config", group: "sheet", icon: "fa-solid fa-shapes", label: "liber.Labels.long.config" },
      biography: { id: "biography", group: "sheet", icon: "fa-solid fa-book", label: "liber.Labels.long.biography" },
      inventory: { id: "inventory", group: "sheet", icon: "fa-solid fa-shapes", label: "liber.Labels.long.inventory" },
      soute: { id: "soute", group: "sheet", icon: "fa-solid fa-shapes", label: "liber.Labels.long.soute" },
      actions: { id: "actions", group: "sheet", icon: "fa-solid fa-bolt", label: "liber.Labels.long.actions" }
    };
    const activeTab = this.tabGroups.sheet || "background";

    for (const v of Object.values(tabs)) {
      v.active = activeTab === v.id;
      v.cssClass = v.active ? "active" : "";
    }
    return tabs;
  }

  /** Préparation des données */
  async _prepareContext() {
    const filter = this.document.system.inventory;
    const filterV = this.document.system.inventoryv;
    const items = this.document.items.toObject();

    // Filtrer les équipements (hors armes de véhicule et salles)
    let equipement = items.filter(item => item.type !== "weaponvehicule" && item.type !== "room");
    let equipementv = items.filter(item => item.type == "weaponvehicule" || item.type == "room");

    // Appliquer le filtre général pour les équipements
    let visibleItems;
    if (filter === "all") {
      visibleItems = equipement;
    } else {
      visibleItems = items.filter(item => filter.includes(item.type));
    }

    // Appliquer le filtre général pour les armes de véhicule et salles
    let visibleItemsV;
    if (filterV === "allv") {
      visibleItemsV = equipementv;
    } else {
      visibleItemsV = items.filter(item => filterV.includes(item.type));
    }

    let img = this.document.img;
    if (!img || !/\.(jpg|jpeg|png|webp|svg)$/i.test(img)) {
      img = "icons/svg/mystery-man.svg"; // Image par défaut
    }

    // Rôles de l'utilisateur : il ne voit que les actions de ses postes.
    const roles = getRoles(this.document);
    const voirEnergie = voitEnergie(this.document);
    const enc = Number(this.document.system.enc) || 0;
    const actions = ACTIONS
      .filter(r => roles.has(r.id))
      .map(r => ({
        id: r.id, titre: r.titre,
        liste: r.liste.map(a => ({
          name: a.name, nom: a.nom, effet: a.effet, coutTexte: coutTexte(a),
          fa: ICONES[a.name] ?? "fa-circle",
          // Griser une action selon l'énergie révélerait le niveau d'énergie : seulement pour ceux qui le voient.
          indispo: voirEnergie && a.cout > enc
        }))
      }));

    return {
      actions,
      estMJ: game.user.isGM,
      voirEnergie,
      mesRoles: [...roles],
      tabs: this.#getTabs(),
      fields: this.document.schema.fields,
      systemFields: this.document.system.schema.fields,
      actor: this.document,
      system: this.document.system,
      visibleItems: visibleItems,
      visibleItemsV: visibleItemsV,
      source: this.document.toObject(),
      items: this.document.items.toObject(),
      calcul: calculerVehicule(this.document), // {{calcul.bonus.pilotage}}, {{calcul.regen}}, {{calcul.alertes}}…
      img // On utilise l'image corrigée
    };
  }

  async _preparePartContext(partId, context) {
    switch (partId) {
      case "biography":
        context.tab = context.tabs.biography;
        context.enrichedBiography = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.document.system.biography, { async: true });
        break;
      case "inventory":
        context.tab = context.tabs.inventory;
        context.items = [];
        const itemsRaw = this.document.items;
        for (const item of itemsRaw) {
          item.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(item.system.description, { async: true });
          context.items.push(item);
        }
        break;
    }
    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const root = this.element;

    //*Garder l'onglet ouvert*//
    const activeTab = localStorage.getItem(`activeTab-${this.actor.id}`) || "config";
    this._setActiveTab(activeTab);
    root.querySelectorAll(".sheet-tabs [data-tab]").forEach(tab => {
      tab.addEventListener("click", (event) => {
        const newTab = event.currentTarget.dataset.tab;
        this._setActiveTab(newTab);
      });
    });

    //*Bord des cercles*//
    root.querySelectorAll(".circle").forEach(circle => {
      const inputs = circle.querySelectorAll('input');
      if (inputs.length < 2) return;

      const current = parseFloat(inputs[0].value) || 0;
      const max = parseFloat(inputs[1].value) || 1;  // éviter division par zéro
      const percent = Math.min(100, Math.max(0, (current / max) * 100));

      circle.style.background = `conic-gradient(
            var(--couleur-rouge) 0%,
            var(--couleur-bleuelect) ${percent - 1}% ,
            var(--couleur-gris) ${percent}% 100%
        )`;
    });
    root.querySelectorAll(".part").forEach(part => {
      const input = part.querySelector('input');
      if (!input) return;
      const value = parseInt(input.value) || 0;
      const nameAttr = input.getAttribute("name");  // récupère system.nom
      const name = nameAttr ? nameAttr.split('.').pop() : '';
      if (!name) return;
      const circle = root.querySelector(`.${name}`);
      if (!circle) return;

      if (value < 5) {
        circle.style.fill = 'var(--couleur-vert)';
      } else if (value < 7) {
        circle.style.fill = 'var(--couleur-orange)';
      } else if (value < 9) {
        circle.style.fill = 'var(--couleur-rouge)';
      }
    });

    // Tab inventaire
    const inventory = this.actor.system.inventory;
    const types = ["all", "weapon", "armor", "shield", "item"];

    if (types.includes(inventory)) {
      const tab = root.querySelector(`.soute div[data-type="${inventory}"]`);
      if (tab) tab.style.border = "solid 1px var(--couleur-bleuelect)";
    }
    // Tab inventaire véhicule
    const inventoryv = this.actor.system.inventoryv;
    const typesv = ["allv", "weaponvehicule", "room"];

    if (typesv.includes(inventoryv)) {
      const tab = root.querySelector(`.vehicule div[data-type="${inventoryv}"]`);
      if (tab) tab.style.border = "solid 1px var(--couleur-bleuelect)";
    }

    /*plus de PV*/
    const armor = this.actor.system.armor;
    const armormax = this.actor.system.armormax;
    const shield = this.actor.system.shield;
    const shieldmax = this.actor.system.shieldmax;
    const hautValue = this.actor.system.haut;
    const droiteValue = this.actor.system.droite;
    const basValue = this.actor.system.bas;
    const gaucheValue = this.actor.system.gauche;
    const amorValue = armormax ? armor * 100 / armormax : 0;
    if (amorValue < 25) {
      root.style.setProperty('--couleur-bleuelect', 'red');
    } else if (amorValue < 50) {
      root.style.setProperty('--couleur-bleuelect', '#ff6c00');
    } else if (amorValue < 75) {
      root.style.setProperty('--couleur-bleuelect', '#56853b');
    } else {
      root.style.setProperty('--couleur-bleuelect', '#00f7ff');
    }

    //couleur du champ de force
    if (shield > shieldmax) {
      root.querySelectorAll('.part-vehicule input').forEach(el => {
        el.style.border = '1px solid var(--couleur-rouge)';
      });
    }

    const champ = root.querySelector(".vehicule-status");
    const quart = shieldmax / 4;
    const moitie = shieldmax / 2;

    const values = { haut: hautValue, bas: basValue, droite: droiteValue, gauche: gaucheValue };

    if (champ) {
      for (const [direction, value] of Object.entries(values)) {
        let color = "green";

        if (value == 0) {
          color = "var(--couleur-rouge)";
        } else if (value < quart) {
          color = "var(--couleur-orange)";
        } else if (value < moitie) {
          color = "var(--couleur-vert)";
        }

        switch (direction) {
          case "haut": champ.style.borderTop = `3px solid ${color}`; break;
          case "bas": champ.style.borderBottom = `3px solid ${color}`; break;
          case "gauche": champ.style.borderLeft = `3px solid ${color}`; break;
          case "droite": champ.style.borderRight = `3px solid ${color}`; break;
        }
      }
    }

    /*Colorise les compétences*/
    root.querySelectorAll(".perso").forEach(compt => {
      const input = compt.querySelector("input");
      if (!input) return;
      const valor = parseInt(input.value, 10) || 0;
      if (valor === 0) {
        input.style.background = "var(--couleur-gris)";
        input.style.color = "var(--couleur-bleuelect)";
      } else if (valor > 0) {
        input.style.background = "var(--couleur-vert)";
        input.style.color = "white";
      } else {
        input.style.background = "var(--couleur-rouge)";
        input.style.color = "white";
      }
    });

    this._onVerif();
  }

  /** @override */
  async _onDrop(event) {
    event.preventDefault();
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    if (data.type === "Item") {
      const item = await Item.fromDropData(data);
      if (item) {
        await this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
      }
    }
  }

  /**
   * Recalcule et enregistre les caractéristiques du véhicule
   * (voir calculerVehicule pour les formules).
   * Plusieurs joueurs peuvent ouvrir la feuille : on n'écrit que si une valeur a réellement changé
   * (évite les mises à jour en boucle) et seulement si l'utilisateur est propriétaire.
   */
  _onVerif() {
    if (!this.actor.isOwner) return;
    const sys = this.actor.system;
    const r = calculerVehicule(this.actor);
    const alertes = [...r.alertes];

    // Champ de force : somme des 4 secteurs
    const haut = Number(sys.haut) || 0;
    const droite = Number(sys.droite) || 0;
    const bas = Number(sys.bas) || 0;
    const gauche = Number(sys.gauche) || 0;
    const shield = haut + droite + bas + gauche;
    if (r.shieldmax - shield < 0) {
      alertes.push("Trop de points de champ de force ont été attribués.");
    }

    // Les valeurs courantes ne dépassent jamais le maximum
    const nrj = Math.min(sys.enc ?? 0, r.encmax);
    const pvCoque = Math.min(sys.health ?? 0, r.healthmax);
    const armor = Math.min(sys.armor ?? 0, r.armormax);

    // ANCIEN système : points d'IA à répartir dans les compétences.
    // À supprimer si l'onglet Compétences est retiré (les bonus viennent maintenant des étoiles).
    const iaM = Number(String(sys.modeleIA ?? "").replace(/\D/g, "")) || 0;
    let total = iaM * -10;
    const competences = sys.competences;
    for (const key in competences) {
      if (Object.prototype.hasOwnProperty.call(competences, key)) {
        total += parseInt(competences[key]) || 0;
      }
    }

    // Alertes : réservées au MJ (évite que chaque joueur reçoive les mêmes notifications),
    // et une seule notification par changement d'état.
    const signature = alertes.join("|");
    if (game.user.isGM && signature && signature !== this._derniereAlerte) {
      alertes.forEach(a => ui.notifications.warn(a));
    }
    this._derniereAlerte = signature;

    const voulu = {
      "system.credit": r.prix,
      "system.armor": armor,
      "system.armormax": r.armormax,
      "system.shield": shield,
      "system.shieldmax": r.shieldmax,
      "system.enc": nrj,
      "system.encmax": r.encmax,
      "system.health": pvCoque,
      "system.healthmax": r.healthmax,
      "system.sun1": etoilesBonus(r.stats.pilotage),   // le template affiche sun1 dans le cercle « pilotage »
      "system.sun2": etoilesBonus(r.stats.mecanique),  // et sun2 dans le cercle « mécanique »
      "system.sun3": etoilesBonus(r.stats.piratage),
      "system.sun4": etoilesBonus(r.stats.visee),
      "system.maxpiece": r.pieceMax,
      "system.maxarme": r.armeMax,
      "system.piece": r.empUtilises,
      "system.arme": r.armesUtil,
      "system.pointrestant": total,
      "system.technogeneral": etoiles(r.techno)
    };

    // Ne met à jour que ce qui a changé
    const update = {};
    for (const [chemin, valeur] of Object.entries(voulu)) {
      if (foundry.utils.getProperty(this.actor, chemin) !== valeur) update[chemin] = valeur;
    }
    if (Object.keys(update).length) this.actor.update(update);
  }

  //#region Actions
  /**
   * Le MJ attribue les rôles d'équipage.
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
   */
  static async #onEquipage(event, target) {
    if (!game.user.isGM) return;
    await gererEquipage(this.actor);
  }

  static #onItemEdit(event, target) {
    const itemId = target.getAttribute('data-item-id');
    const item = this.actor.items.get(itemId);
    item.sheet.render(true);
  }

  static async #onItemDelete(event, target) {
    const itemId = target.getAttribute('data-item-id');
    const item = this.actor.items.get(itemId);
    if (item.system.quantity > 1) {
      await item.update({ "system.quantity": item.system.quantity - 1 });
    } else {
      item.delete();
    }
  }

  static async #onItemRollSave(event, target) { // si competence tir ou visee ou combat
    const ability = target.getAttribute('data-ability');
    await this.actor.rollSave(ability);
  }

  /**
   * Jet de compétence du véhicule (le véhicule agit seul, via son IA).
   * Seuil = 30 + bonus d'étoiles de la statistique correspondante + bonus libre.
   * Si la compétence n'est pas reliée à une statistique, l'ancienne valeur saisie est utilisée.
   */
  static async #onItemRollDamage(event, target) {
    const compt = target.getAttribute('data-compt');
    const roll = await new Roll("1d100").roll();
    const bonus = parseInt(this.actor.system.bonus) || 0;

    const calcul = calculerVehicule(this.actor);
    const stat = STAT_PAR_COMPETENCE[slug(compt)];
    const valeur = stat
      ? calcul.bonus[stat]
      : (parseInt(this.actor.system.competences?.[compt]) || 0);

    // Seuils critiques modifiés par l'état du véhicule (prototype, neuf, usagé, vétuste)
    const critique = calcul.critique;
    const echec = calcul.echecCrit;
    const base = 30;
    const actor = this.actor;
    let succes = "";
    const valuemax = base + valeur + bonus;
    const result = roll.total;
    const label = game.i18n.localize(`Liber.Character.Competences.${compt}`);
    let infodegat;
    let color = "var(--couleur-bleuelect)";
    let infoarme = "";

    const info = `${result}/${valuemax}`;

    if (result > echec || valuemax == 0) {
      succes = game.i18n.localize("Liber.Roll.EchecCrit");
      color = 'var(--couleur-rouge)';
    } else if (result <= critique) {
      succes = game.i18n.localize("Liber.Roll.ReussiteCrit");
      color = 'var(--couleur-vert)';
    } else if (result <= valuemax) {
      succes = game.i18n.localize("Liber.Roll.Reussite");
      color = 'var(--couleur-bleuelect)';
    } else {
      succes = game.i18n.localize("Liber.Roll.Echec");
      color = 'var(--couleur-orange)';
    }

    const chatData = {
      actingCharName: actor.name,
      actingCharImg: actor.img,
      info: info,
      introText: label,
      infoarme: infoarme,
      infodegat: infodegat,
      color: color,
      succes: succes
    };

    const chat = await new LiberChat(this.actor)
      .withTemplate("systems/libersf/templates/chat/roll-dammage.hbs")
      .withContent("rollDamage")
      .withData(chatData)
      .create();

    await chat.display();
  }

  static async #onShortRest(event, target) {
    await this.actor.system.shortRest();
  }

  static async #onFullRest(event, target) {
    await this.actor.system.fullRest();
  }

  /**
   * Action à bord : consomme de l'énergie (POURCENTAGE 0-100) selon la table ACTIONS.
   * Les actions de tir demandent l'arme (coût = énergie de l'arme + supplément).
   * Réservé aux utilisateurs qui ont le rôle correspondant (le MJ les a tous).
   */
  static async #onFullDown(event, target) {
    const def = trouverAction(target.getAttribute('data-name'));
    if (!def) return;
    if (!getRoles(this.actor).has(roleDeAction(def.name))) {
      return ui.notifications.warn("Vous n'avez pas ce rôle sur ce véhicule.");
    }
    const actor = this.actor;
    const sys = actor.system;
    let cout = def.cout;
    let detail = "";
    if (def.arme) {
      const armes = await choisirArmes(actor, def.arme);
      if (!armes) return;
      cout += armes.reduce((n, a) => n + coutArme(a), 0);
      detail = ` (${armes.map(a => a.name).join(" + ")})`;
    }

    const enc = Number(sys.enc) || 0;
    const update = {};
    let color = "var(--couleur-bleuelect)";
    let succes = def.horsCombat ? "Hors combat" : `${game.i18n.localize('Liber.Character.Action.Vehicule.Energie')} ${cout} %`;
    let echec = false;

    if (cout > enc) {   // panne : rien n'est consommé
      echec = true;
      color = enc === 0 ? "var(--couleur-rouge)" : "var(--couleur-orange)";
      succes = game.i18n.localize(enc === 0 ? 'Liber.Character.Action.Vehicule.Panne' : 'Liber.Character.Action.Vehicule.Pannes');
    } else {
      let nrj = enc - cout;
      let pv = Number(sys.health) || 0;
      const pvMax = Number(sys.healthmax) || 0;
      if (def.convertir) {
        const perte = Math.round(pvMax * def.convertir.pv);
        if (pv <= perte) { ui.notifications.warn("Coque trop endommagée pour la surcharge."); return; }
        pv -= perte;
        nrj = Math.min(100, nrj + def.convertir.nrj);
        succes = `Coque -${perte} PV · Énergie +${def.convertir.nrj} %`;
        update["system.health"] = pv;
      }
      if (def.soin) {
        const gain = Math.min(Math.round(pvMax * def.soin), Math.max(0, pvMax - pv));
        update["system.health"] = pv + gain;
        succes += ` · Coque +${gain} PV`;
      }
      update["system.enc"] = nrj;
    }

    const chat = await new LiberChat(actor)
      .withTemplate("systems/libersf/templates/chat/roll-dammage.hbs")
      .withContent("rollDamage")
      .withData({
        actingCharName: actor.name,
        actingCharImg: actor.img,
        introText: "",
        infoarme: `<b>${def.nom}</b>${detail}<br>${def.effet}`,
        color,
        succes
      })
      .create();
    await chat.display();
    if (!echec) await actor.update(update);
  }

  /** Bouton « Nouveau tour » : réservé au MJ et au mécanicien (ceux qui voient l'énergie). */
  static async #onNewTurn(event, target) {
    if (!voitEnergie(this.actor)) {
      return ui.notifications.warn("Seul le mécanicien peut gérer l'énergie.");
    }
    await debutDeTour(this.actor);
  }

  static async #onItemEquip(event, target) {
    const itemId = target.getAttribute('data-item-id');
    let equipLocation = target.getAttribute('data-ou');

    const item = this.actor.items.get(itemId);
    if (item.system.equip == "pilote") {
      equipLocation = "";
    }
    await item.update({ 'system.equip': equipLocation });
  }

  static async #onItemDesequip(event, target) {
    const itemId = target.getAttribute('data-item-id');
    const item = this.actor.items.get(itemId);
    const equipLocation = target.getAttribute('data-ou');
    if (equipLocation == "middle") {
      await this.actor.update({ 'system.armor': 0, 'system.armormax': 0 });
    } else if (equipLocation == "ceinture") {
      await this.actor.update({ 'system.shield': 0, 'system.shieldmax': 0 });
    }
    await item.update({ 'system.equip': "" });
  }

  static async #onFiltre(event, target) {
    const types = target.getAttribute('data-type');
    this.actor.update({ 'system.inventory': types });
  }

  static async #onFiltres(event, target) {
    const types = target.getAttribute('data-type');
    this.actor.update({ 'system.inventoryv': types });
  }

  /**
   * Handle changing a Document's image.
   * @this LiberVehiculeSheet
   */
  static async #onEditImage(event, target) {
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const { img } = this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ?? {};
    const FilePickerImpl = foundry.applications.apps.FilePicker.implementation;
    return new FilePickerImpl({
      current,
      type: "image",
      redirectToRoot: img ? [img] : [],
      callback: path => this.document.update({ [attr]: path }),
      top: this.position.top + 40,
      left: this.position.left + 10,
    }).browse();
  }

  /*conserver le dernier onglet ouvert*/
  /** @override */
  _setActiveTab(tabId) {
    if (!this.actor) return;

    localStorage.setItem(`activeTab-${this.actor.id}`, tabId);

    this.element.querySelectorAll(".tab").forEach(tab => {
      tab.style.display = "none";
    });

    const activeTab = this.element.querySelector(`.tab[data-tab="${tabId}"]`);
    if (activeTab) {
      activeTab.style.display = "block";
    }

    this.element.querySelectorAll(".sheet-tabs [data-tab]").forEach(tab => {
      tab.classList.remove("active");
    });

    const activeTabNav = this.element.querySelector(`.sheet-tabs [data-tab="${tabId}"]`);
    if (activeTabNav) {
      activeTabNav.classList.add("active");
    }

    if (!game.user.isGM) {
      this.element.querySelectorAll('.reponse').forEach(element => {
        element.style.display = "none";
      });
    }
  }

}

/**
 * Refuse l'ajout d'une pièce ou d'une arme incompatible avec le véhicule.
 * Fonctionne pour tout ajout (glisser-déposer, macro, compendium).
 */
Hooks.on("preCreateItem", (item, data, options, userId) => {
  if (userId !== game.user.id) return;
  const message = verifierAjout(item.parent, item);
  if (message) {
    ui.notifications.warn(message);
    return false;
  }
});

/**
 * Tour de combat : quand c'est au tour d'un véhicule, son énergie se régénère.
 * Exécuté uniquement par le MJ actif (évite le double traitement).
 */
Hooks.on("updateCombat", async (combat, changed) => {
  if (!game.user.isActiveGM) return;
  if (!("turn" in changed) && !("round" in changed)) return;
  const actor = combat.combatant?.actor;
  if (!actor || actor.system?.taillevehicule === undefined) return;
  await debutDeTour(actor);
});