const ActorSheetV2 = foundry.applications.sheets.ActorSheetV2;
const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
import LiberChat from "../document/chat.js";

/* ==========================================================================
 *  RÈGLES DES VÉHICULES : version « paliers » + pièces
 *
 *  Champs optionnels à ajouter au modèle de données du véhicule
 *  (valeurs par défaut gérées si absents) :
 *    - modeleChamp  (String)  "M1"…"M10" ou "P0"…"P8" : générateur de champ de force
 *                             (absent : on reprend le palier du moteur, comme avant)
 *    - anciennete   (String)  Prototype | Neuf | Standard | Usage | Vetuste
 *    - iaActive     (Boolean) true par défaut ; false = IA désactivée
 *    - iaPlus / iaMoins (String) spécialisation d'IA : pilotage | mecanique | piratage | visee
 *
 *  Coûts d'énergie des actions : voir COUT_ACTIONS (en %, indexés par data-name du template).
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
  moteur:   [null, 0, 1, 2, 3, 4, 5, 6, 7, 7, 8], // Propulsion furtive devient un module
  blindage: [null, 0, 1, 2, 3, 4, 5, 6, 7, 7, 8], // Blindage énergétique absorbé par le champ
  champ:    [null, 0, 1, 2, 3, 4, 5, 6, 7, 7, 8]
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

/** Bonus donné au joueur à un poste : +5 par ★ entière au-dessus de ★ (max +20). */
const bonusEtoiles = (p) => Math.min(20, 5 * Math.floor(p / 2));

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
 * Coût en énergie (en %) de chaque action, indexé par le data-name des icônes du template.
 * Prioritaire sur data-full : les templates n'ont pas besoin d'être modifiés.
 */
const COUT_ACTIONS = {
  // Pilote
  evasive: 20, pique: 10, leurre: 5, invisible: 15, tactique: 5, sprint: 25,
  // Passagers
  shoot: 5, repair: 15, surcharge: 0, radar: 5, radio: 5, medic: 10,
  urgence: 10, sabotage: 20, abordage: 40
};

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
  const usage = sys.usage;
  const anc = ANCIENNETE[slug(sys.anciennete)] ?? ANCIENNETE.standard;
  const alertes = [];

  // --- Paliers des composants ---
  const pIA = versPalier(sys.modeleIA, "ia");
  const pMoteur = versPalier(sys.modeleMoteur, "moteur");
  const pBlindage = versPalier(sys.modeleBlindage, "blindage");
  const pChamp = sys.modeleChamp ? versPalier(sys.modeleChamp, "champ") : pMoteur;

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
      } else {
        empUtilises += empItem(item) * qty;
        prixPieces += (item.system?.valeur || 0) * qty;
      }
    }
  }
  for (const [cle, n] of Object.entries(compte)) {
    if (n > PIECES[cle].max) alertes.push(`${cle} : maximum ${PIECES[cle].max} par véhicule.`);
  }

  // --- Défenses, coque, énergie ---
  const armormax = (pBlindage + 1) * 100 * nbtaille;
  let shieldmax = (pChamp + 1) * 100 * nbtaille;
  let healthmax = 200 * nbtaille * nbtaille;
  let armeMax = 2 * nbtaille;
  let pieceMax = 10 * nbtaille;
  let regen = 10 + 5 * pMoteur + 10 * (compte["generateur-auxiliaire"] || 0);

  // Vocation du véhicule
  if (usage === "Combat") armeMax += 2;
  else if (usage === "Exploration") regen += 10;
  else if (usage === "Commerce") healthmax *= 2;
  else if (usage === "Industriel") { pieceMax += 2; shieldmax = Math.round(shieldmax * 1.5); }
  regen = Math.min(100, regen);

  // --- Vérifications ---
  if (empUtilises > pieceMax) alertes.push(`Trop de pièces : ${empUtilises} emplacements utilisés sur ${pieceMax}.`);
  if (armesUtil > armeMax) alertes.push(`Trop d'armes : ${armesUtil} emplacements utilisés sur ${armeMax}.`);
  if (pMoteur === PALIER_MAX && (type !== "Space" || nbtaille < 2)) {
    alertes.push("Le moteur Warp n'équipe que les vaisseaux spatiaux de taille Moyen ou plus.");
  }

  // --- Prix : base de taille + composants, x ancienneté, + armes et pièces ---
  const composant = (p) => Math.pow(p + 1, 2) * 100 * nbtaille;
  const prixCoque = 20000 * nbtaille + composant(pMoteur) + composant(pBlindage) + composant(pChamp) + composant(pIA);
  const prix = Math.round(prixCoque * anc.prix + prixArmes + prixPieces);

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
  }
  if (r.empUtilises + emp > r.pieceMax) {
    return `${item.name} : plus assez d'emplacements de pièces (${r.empUtilises} / ${r.pieceMax}).`;
  }
  return null;
}

/** Gestion de la feuille de véhicule */

export default class LiberVehiculeSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["liber", "actor", "character"],
    position: { width: 500, height: 900 },
    form: { submitOnChange: true },
    window: { resizable: true },
    dragDrop: [{ dragSelector: '[data-drag]', dropSelector: '.inventory-list' }], // Remplacer '.inventory-list' par votre sélecteur    tabGroups: { sheet: "inventory" },
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
      newTurn: LiberVehiculeSheet.#onNewTurn // NOUVEAU : bouton « Nouveau tour »
    }
  };

  /** @override */
  static PARTS = {
    header: { template: "systems/libersf/templates/actors/vehicule-header.hbs" },
    tabs: { template: "systems/libersf/templates/actors/character-navigation.hbs" },
    stat: { template: "systems/libersf/templates/actors/vehicule-stat.hbs" },
    biography: { template: "systems/libersf/templates/actors/vehicule-biography.hbs" },
    inventory: { template: "systems/libersf/templates/actors/vehicule-inventory.hbs" },
    competence: { template: "systems/libersf/templates/actors/vehicule-competence.hbs" }
  };


  /** Gestion des onglets */
  #getTabs() {
    const tabs = {
      config: { id: "config", group: "sheet", icon: "fa-solid fa-shapes", label: "liber.Labels.long.config" },
      biography: { id: "biography", group: "sheet", icon: "fa-solid fa-book", label: "liber.Labels.long.biography" },
      inventory: { id: "inventory", group: "sheet", icon: "fa-solid fa-shapes", label: "liber.Labels.long.inventory" },
      competence: { id: "competence", group: "sheet", icon: "fa-solid fa-shapes", label: "liber.Labels.long.competence" }

    };
    const activeTab = this.tabGroups.sheet || "background"; // Si aucune valeur n'est définie, l'onglet "features" est activé par défaut.

    for (const v of Object.values(tabs)) {
      v.active = activeTab === v.id;
      v.cssClass = v.active ? "active" : "";
    }
    return tabs;
  }

  /** Préparation des données */
  async _prepareContext() {
    console.log("Préparation du contexte de la feuille de personnage...");
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
    return {
      tabs: this.#getTabs(),
      fields: this.document.schema.fields,
      systemFields: this.document.system.schema.fields,
      actor: this.document,
      system: this.document.system,
      visibleItems: visibleItems,
      visibleItemsV: visibleItemsV,
      source: this.document.toObject(),
      items: this.document.items.toObject(),
      calcul: calculerVehicule(this.document), // NOUVEAU : {{calcul.bonus.pilotage}}, {{calcul.regen}}, {{calcul.alertes}}…
      img // On utilise l'image corrigée
    };

  }

  async _preparePartContext(partId, context) {
    switch (partId) {
      case "biography":
        context.tab = context.tabs.biography;
        context.enrichedBiography = await foundry.applications.ux.TextEditor.enrichHTML(this.document.system.biography, { async: true });
        break;
      case "inventory":
        context.tab = context.tabs.inventory;
        context.items = [];
        const itemsRaw = this.document.items;
        for (const item of itemsRaw) {
          item.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(item.system.description, { async: true });
          context.items.push(item);
        }
        break;
    }
    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);  // Appelez la méthode parente si nécessaire
    console.log(context);

    //*Garder l'onglet ouvert*//
    const activeTab = localStorage.getItem(`activeTab-${this.actor.id}`) || "config";
    // Appliquer l'affichage correct
    this._setActiveTab(activeTab);
    // Gérer le clic sur les onglets pour changer de vue
    this.element.querySelectorAll(".sheet-tabs [data-tab]").forEach(tab => {
      tab.addEventListener("click", (event) => {
        const newTab = event.currentTarget.dataset.tab;
        this._setActiveTab(newTab);
      });
    });

    //*Bord des cercles*//
    document.querySelectorAll(".circle").forEach(circle => {
      const inputs = circle.querySelectorAll('input');
      if (inputs.length < 2) return;

      const current = parseFloat(inputs[0].value) || 0;
      const max = parseFloat(inputs[1].value) || 1;  // éviter division par zéro
      const percent = Math.min(100, Math.max(0, (current / max) * 100));  // clamp entre 0 et 100

      circle.style.background = `conic-gradient(
            var(--couleur-rouge) 0%,
            var(--couleur-bleuelect) ${percent - 1}% ,
            var(--couleur-gris) ${percent}% 100%
        )`;
    });
    document.querySelectorAll(".part").forEach(part => {
      const input = part.querySelector('input');//value
      const value = parseInt(input?.value) || 0;
      const nameAttr = part.querySelector("input").getAttribute("name");  // récupère system.nom
      const name = nameAttr ? nameAttr.split('.').pop() : '';
      const circle = this.element.querySelector(`.${name}`);  // Sélectionne le <circle> à modifier
      if (!circle) return;

      if (value < 5) {
        circle.style.fill = 'var(--couleur-vert)';
      } else if (value < 7) {
        circle.style.fill = 'var(--couleur-orange)';
      } else if (value < 9) {
        circle.style.fill = 'var(--couleur-rouge)';
      } else {
        //circle.style.display = 'none';
      }
    });

    // Tab inventaire
    const inventory = this.actor.system.inventory;
    const types = ["all", "weapon", "armor", "shield", "item"];

    if (types.includes(inventory)) {
      const activeTab = document.querySelector(`.soute div[data-type="${inventory}"]`);
      if (activeTab) {
        activeTab.style.border = "solid 1px var(--couleur-bleuelect)";
      }
    }
    // Tab inventaire
    const inventoryv = this.actor.system.inventoryv;
    const typesv = ["allv", "weaponvehicule", "room"];

    if (typesv.includes(inventoryv)) {
      const activeTab = document.querySelector(`.vehicule div[data-type="${inventoryv}"]`);
      if (activeTab) {
        activeTab.style.border = "solid 1px var(--couleur-bleuelect)";
      }
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
    const amorValue = armor * 100 / armormax;
    if (amorValue < 25) {
      this.element.style.setProperty('--couleur-bleuelect', 'red');
    } else if (amorValue < 50) {
      this.element.style.setProperty('--couleur-bleuelect', '#ff6c00');
    } else if (amorValue < 75) {
      this.element.style.setProperty('--couleur-bleuelect', '#56853b');
    } else {
      this.element.style.setProperty('--couleur-bleuelect', '#00f7ff');
    }

    //couleur du champ de force
    if (shield > shieldmax) {
      this.element.querySelectorAll('.part-vehicule input').forEach(el => {
        el.style.border = '1px solid var(--couleur-rouge)';
      });
    }

    const champ = this.element.querySelector(".vehicule-status");
    /*if(shield==0){ 
        champ.style.border='solid 3px var(--couleur-grisclair)';
    }*/
    const quart = shieldmax / 4;
    const moitie = shieldmax / 2;

    // Valeurs des boucliers
    const values = {
      haut: hautValue,
      bas: basValue,
      droite: droiteValue,
      gauche: gaucheValue
    };

    // Pour chaque direction, appliquer la couleur correspondante à la bonne bordure
    for (const [direction, value] of Object.entries(values)) {
      let color = "green"; // valeur par défaut

      if (value == 0) {
        color = "var(--couleur-rouge)";
      } else if (value < quart) {
        color = "var(--couleur-orange)";
      } else if (value < moitie) {
        color = "var(--couleur-vert)";
      }

      switch (direction) {
        case "haut":
          champ.style.borderTop = `3px solid ${color}`;
          break;
        case "bas":
          champ.style.borderBottom = `3px solid ${color}`;
          break;
        case "gauche":
          champ.style.borderLeft = `3px solid ${color}`;
          break;
        case "droite":
          champ.style.borderRight = `3px solid ${color}`;
          break;
      }
    }

    /*Colorise les compétences*/
    document.querySelectorAll(".perso").forEach(compt => {
      const input = compt.querySelector("input");
      const valor = parseInt(input?.value, 10) || 0; // Vérifie si input existe et parse en nombre
      // Appliquer la couleur selon la valeur
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

  /** Gestion des événements au rendu */
  /** @override */
  async _onDrop(event) {
    event.preventDefault();
    const data = TextEditor.getDragEventData(event);
    if (data.type === "Item") {
      const item = await Item.fromDropData(data);
      console.log("Objet droppé :", item);
      if (item) {
        await this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
      }
    }
  }


  /**
   * Recalcule et enregistre les caractéristiques du véhicule
   * (voir calculerVehicule pour les formules).
   */
  _onVerif() {
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
    const nrj = Math.min(sys.enc ?? 0, r.encmax);          // énergie en %
    const pvCoque = Math.min(sys.health ?? 0, r.healthmax); // PV de coque
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

    // Une seule notification par changement d'état (évite le spam à chaque rendu)
    const signature = alertes.join("|");
    if (signature && signature !== this._derniereAlerte) {
      alertes.forEach(a => ui.notifications.warn(a));
    }
    this._derniereAlerte = signature;

    this.actor.update({
      "system.credit": r.prix,
      "system.armor": armor,
      "system.armormax": r.armormax,
      "system.shield": shield,
      "system.shieldmax": r.shieldmax,
      "system.enc": nrj,
      "system.encmax": r.encmax,
      "system.health": pvCoque,
      "system.healthmax": r.healthmax,
      "system.sun1": etoiles(r.stats.pilotage),   // le template affiche sun1 dans le cercle « pilotage »
      "system.sun2": etoiles(r.stats.mecanique),  // et sun2 dans le cercle « mécanique »
      "system.sun3": etoiles(r.stats.piratage),
      "system.sun4": etoiles(r.stats.visee),
      "system.maxpiece": r.pieceMax,
      "system.maxarme": r.armeMax,
      "system.piece": r.empUtilises,
      "system.arme": r.armesUtil,
      "system.pointrestant": total,
      "system.technogeneral": etoiles(r.techno)
    });
  }

  //#region Actions
  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
   */
  static #onItemEdit(event, target) {
    const itemId = target.getAttribute('data-item-id');
    const item = this.actor.items.get(itemId);
    item.sheet.render(true);
  }

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
   */
  static async #onItemDelete(event, target) {
    const itemId = target.getAttribute('data-item-id');
    const item = this.actor.items.get(itemId);
    if (item.system.quantity > 1) {
      await item.update({ "system.quantity": item.system.quantity - 1 });
    } else {
      item.delete();
    }
  }

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
   */
  static async #onItemRollSave(event, target) {//si competence tir ou visee ou combat
    const ability = target.getAttribute('data-ability');
    await this.actor.rollSave(ability);
  }


  //a voir si utile
  async afficherDialogueSelection(weapons, TIRMODES) {
    return new Promise((resolve) => {
      const options = weapons.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
      const tirOptions = Object.entries(TIRMODES)
        .map(([key, label]) => `<option value="${key}">${label}</option>`)
        .join('');

      new Dialog({
        title: "Sélectionnez une arme",
        content: `
            <p>${game.i18n.localize("Liber.Roll.Choixarme")}</p>
            <select id="selected-weapon">${options}</select>
            <p>${game.i18n.localize("Liber.Roll.Choixtir")}</p>
            <select id="selected-tir">${tirOptions}</select>
          `,
        buttons: {
          confirm: {
            label: "Valider",
            callback: (html) => {
              const weaponId = html[0].querySelector("#selected-weapon").value;
              const selectedTir = html[0].querySelector("#selected-tir").value;
              resolve({ weaponId, selectedTir });
            }
          },
          cancel: {
            label: "Annuler",
            callback: () => resolve(null)
          }
        },
        default: "confirm"
      }).render(true);
    });
  }

  //a voir si utile
  async afficherDialogueAbbility() {
    return new Promise((resolve) => {
      const dlg = new Dialog({
        title: "Niveau de technologie",
        content: `
                <p>${game.i18n.localize(`Liber.Items.Techno`)} :</p>
                <select id="tech-level" name="system.techno">
                    <option value="0" selected>☆ ☆ ☆ ☆ ☆</option>
                    <option value="1">✬ ☆ ☆ ☆ ☆</option>
                    <option value="2">★ ☆ ☆ ☆ ☆</option>
                    <option value="3">★ ✬ ☆ ☆ ☆</option>
                    <option value="4">★ ★ ☆ ☆ ☆</option>
                    <option value="5">★ ★ ✬ ☆ ☆</option>
                    <option value="6">★ ★ ★ ☆ ☆</option>
                    <option value="7">★ ★ ★ ✬ ☆</option>
                    <option value="8">★ ★ ★ ★ ☆</option>
                    <option value="9">★ ★ ★ ★ ✬</option>
                    <option value="10">★ ★ ★ ★ ★</option>
                </select>
            `,
        buttons: {
          confirm: {
            label: "Valider",
            callback: (html) => {
              const select = html[0].querySelector("#tech-level");
              const level = parseInt(select.value);
              resolve(level);
            }
          },
          cancel: {
            label: "Annuler",
            callback: () => resolve(null)
          }
        },
        default: "confirm"
      });
      dlg.render(true);
    });
  }

  /**
   * Jet de compétence du véhicule (le véhicule agit seul, via son IA).
   * Seuil = 30 + bonus d'étoiles de la statistique correspondante + bonus libre.
   * Si la compétence n'est pas reliée à une statistique, l'ancienne valeur saisie est utilisée.
   *
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
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
    let info = "";
    let succes = "";
    const valuemax = base + valeur + bonus;
    const result = roll.total;
    const label = game.i18n.localize(`Liber.Character.Competences.${compt}`);
    let infodegat;
    let color = "var(--couleur-bleuelect)";
    let infoarme = "";

    info = `${result}/${valuemax}`;

    // Définir le message en fonction du résultat
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

    console.log(`Résultat: ${result}, Limite: ${valuemax}, Info: ${info}, Succès: ${succes}`);
    let chatData = {
      actingCharName: actor.name,
      actingCharImg: actor.img,
      info: info,
      introText: label,
      infoarme: infoarme,
      infodegat: infodegat,
      color: color,
      succes: succes
    };

    let chat = await new LiberChat(this.actor)
      .withTemplate("systems/libersf/templates/chat/roll-dammage.hbs")
      .withContent("rollDamage")
      .withData(chatData)
      .create();

    await chat.display();
  }


  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
   */
  static async #onShortRest(event, target) {
    await this.actor.system.shortRest();
  }

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
   */
  static async #onFullRest(event, target) {
    await this.actor.system.fullRest();
  }

  /**
   * Action à bord : consomme de l'énergie.
   * L'énergie est un POURCENTAGE (0-100). Coût lu dans COUT_ACTIONS, à défaut dans data-full.
   */
  static async #onFullDown(event, target) {
    const name = target.getAttribute('data-name');
    const cout = COUT_ACTIONS[name] ?? (Number(target.getAttribute('data-full')) || 0);
    const actor = this.actor;
    const label = game.i18n.localize('Liber.Character.Action.Vehicule.' + name);
    let color = "var(--couleur-bleuelect)";
    let succes = `${game.i18n.localize('Liber.Character.Action.Vehicule.Energie')} ${cout} %`;
    let full = this.actor.system.enc;
    if (full == 0) {
      succes = game.i18n.localize('Liber.Character.Action.Vehicule.Panne');
      color = "var(--couleur-rouge)";
    }
    full = full - cout;
    if (full < 0) {
      succes = game.i18n.localize('Liber.Character.Action.Vehicule.Pannes');
      color = "var(--couleur-orange)";
    }
    let chatData = {
      actingCharName: actor.name,
      actingCharImg: actor.img,
      introText: "",
      infoarme: label,
      color: color,
      succes: succes
    };

    let chat = await new LiberChat(this.actor)
      .withTemplate("systems/libersf/templates/chat/roll-dammage.hbs")
      .withContent("rollDamage")
      .withData(chatData)
      .create();

    await chat.display();
    if (full < 0) {
      return;
    }
    this.actor.update({ 'system.enc': full });
  }

  /**
   * NOUVEAU : début de tour.
   *  - énergie : + (10 % + 5 % par ☆ de moteur + générateurs auxiliaires, etc.)
   *  - champ de force : +10 % de son maximum s'il n'a pas été touché au tour précédent
   * Bouton à ajouter au template : <a data-action="newTurn">Nouveau tour</a>
   */
  static async #onNewTurn(event, target) {
    const sys = this.actor.system;
    const r = calculerVehicule(this.actor);

    const nrj = Math.min(r.encmax, (sys.enc ?? 0) + r.regen);
    const update = { "system.enc": nrj };

    const touche = await DialogV2.confirm({
      window: { title: "Nouveau tour" },
      content: "<p>Le champ de force a-t-il été touché au tour précédent ?</p>",
      yes: { label: "Oui" },
      no: { label: "Non" }
    });

    let infoChamp = "";
    if (touche === false) {
      const actuel = (Number(sys.haut) || 0) + (Number(sys.droite) || 0) + (Number(sys.bas) || 0) + (Number(sys.gauche) || 0);
      const gain = Math.min(Math.round(r.shieldmax * 0.10), Math.max(0, r.shieldmax - actuel));
      const parSecteur = Math.floor(gain / 4);
      for (const s of ["haut", "droite", "bas", "gauche"]) {
        update[`system.${s}`] = (Number(sys[s]) || 0) + parSecteur;
      }
      infoChamp = ` · Champ de force +${parSecteur * 4}`;
    }

    let chatData = {
      actingCharName: this.actor.name,
      actingCharImg: this.actor.img,
      introText: "",
      infoarme: "Nouveau tour",
      color: "var(--couleur-bleuelect)",
      succes: `Énergie +${r.regen} %${infoChamp}`
    };
    let chat = await new LiberChat(this.actor)
      .withTemplate("systems/libersf/templates/chat/roll-dammage.hbs")
      .withContent("rollDamage")
      .withData(chatData)
      .create();
    await chat.display();

    await this.actor.update(update);
  }

  //a voir si utile pour pilote mettre en bleuelect
  static async #onItemEquip(event, target) {
    const itemId = target.getAttribute('data-item-id');
    let equipLocation = target.getAttribute('data-ou');

    // Récupération de l'item
    const item = this.actor.items.get(itemId);
    if (item.system.equip == "pilote") {
      equipLocation = "";
    }
    await item.update({ 'system.equip': equipLocation });
  }

  static async #onItemDesequip(event, target) {
    // Récupération de l'item
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
   *
   * @this BoilerplateActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise}
   * @private
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

    // Stocker l'onglet actif en utilisant l'ID de l'acteur
    localStorage.setItem(`activeTab-${this.actor.id}`, tabId);

    // Masquer tous les onglets
    this.element.querySelectorAll(".tab").forEach(tab => {
      tab.style.display = "none";
    });

    // Afficher seulement l'onglet actif
    const activeTab = this.element.querySelector(`.tab[data-tab="${tabId}"]`);
    if (activeTab) {
      activeTab.style.display = "block";
    }

    // Mettre à jour la classe "active" dans la navigation
    this.element.querySelectorAll(".sheet-tabs [data-tab]").forEach(tab => {
      tab.classList.remove("active");
    });

    const activeTabNav = this.element.querySelector(`.sheet-tabs [data-tab="${tabId}"]`);
    if (activeTabNav) {
      activeTabNav.classList.add("active");
    }

    const GM = game.user.isGM;
    if (!GM) { // Vérifie si le joueur n'est PAS GM
      document.querySelectorAll('.reponse').forEach(element => {
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