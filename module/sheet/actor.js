const ActorSheetV2 = foundry.applications.sheets.ActorSheetV2;
const { HandlebarsApplicationMixin } = foundry.applications.api;
import LiberChat from "../document/chat.js";
import { RaceBonus, MetierBonus } from "../data/constants.js";
import WeaponSelectionDialog from "../document/weponselectiondialog.js";
import TechLevelDialog from "../document/techleveldialog.js";

export default class LiberCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["liber", "actor", "character"],
    position: { width: 500, height: 900 },
    form: { submitOnChange: true },
    window: { resizable: true },
    dragDrop: [{ dragSelector: '[data-drag]', dropSelector: '.inventory-list' }],
    actions: {
      editImage:  LiberCharacterSheet.#onEditImage,
      edit:       LiberCharacterSheet.#onItemEdit,
      use:        LiberCharacterSheet.#onItemUse,
      delete:     LiberCharacterSheet.#onItemDelete,
      rollSave:   LiberCharacterSheet.#onItemRollSave,
      rollDamage: LiberCharacterSheet.#onItemRollDamage,
      filtre:     LiberCharacterSheet.#onFiltre,
      equip:      LiberCharacterSheet.#onItemEquip,
      desequip:   LiberCharacterSheet.#onItemDesequip,
      kit:        LiberCharacterSheet.#onKit,
      level1:     LiberCharacterSheet.#initializerNiveau1,
      AddCompt:   LiberCharacterSheet.#addCompt,
    }
  };

  static PARTS = {
    header:     { template: "systems/libersf/templates/actors/character-header.hbs" },
    tabs:       { template: "systems/libersf/templates/actors/character-navigation.hbs" },
    stat:       { template: "systems/libersf/templates/actors/character-stat.hbs" },
    biography:  { template: "systems/libersf/templates/actors/character-biography.hbs" },
    inventory:  { template: "systems/libersf/templates/actors/character-inventory.hbs" },
    competence: { template: "systems/libersf/templates/actors/character-competence.hbs" }
  };

  // ─── Onglets ─────────────────────────────────────────────────────────────────

  #getTabs() {
    const activeTab = this.tabGroups.sheet ?? "config";
    const defs = {
      config:     { icon: "fa-solid fa-shapes",  label: "liber.Labels.long.config" },
      biography:  { icon: "fa-solid fa-book",    label: "liber.Labels.long.biography" },
      inventory:  { icon: "fa-solid fa-shapes",  label: "liber.Labels.long.inventory" },
      competence: { icon: "fa-solid fa-shapes",  label: "liber.Labels.long.competence" },
    };
    return Object.fromEntries(
      Object.entries(defs).map(([id, def]) => [
        id,
        { id, group: "sheet", ...def, active: activeTab === id, cssClass: activeTab === id ? "active" : "" }
      ])
    );
  }

  // ─── Contexte ────────────────────────────────────────────────────────────────

  async _prepareContext() {
    const { items } = this.document;
    const filter = this.document.system.inventory;

    const filteredItems = { droite: [], gauche: [], middle: [], ceinture: [], chargeur: [], autres: [] };
    for (const item of items) {
      const loc = item.system?.equip;
      (filteredItems[loc] ?? filteredItems.autres).push(item);
    }

    const competences = items.filter(i => i.type === "competence");
    const competencesMetier = await this.getCompetencesMetier(this.actor.system.metier, competences);

    const visibleItems = filter === "all"
      ? items.filter(i => i.type !== "competence")
      : items.filter(i => filter.includes(i.type));

    const img = /\.(jpg|jpeg|png|webp|svg)$/i.test(this.document.img)
      ? this.document.img
      : "icons/svg/mystery-man.svg";

    return {
      tabs: this.#getTabs(),
      fields: this.document.schema.fields,
      systemFields: this.document.system.schema.fields,
      actor: this.document,
      system: this.document.system,
      inventory: filteredItems,
      visibleItems,
      competencesMetier,
      competences,
      source: this.document.toObject(),
      items: items.toObject(),
      img,
    };
  }

  async _preparePartContext(partId, context) {
    switch (partId) {
      case "biography":
        context.tab = context.tabs.biography;
        context.enrichedBiography = await foundry.applications.ux.TextEditor.enrichHTML(
          this.document.system.biography, { async: true }
        );
        break;
      case "inventory":
        context.tab = context.tabs.inventory;
        context.items = [];
        for (const item of this.document.items) {
          item.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(
            item.system.description, { async: true }
          );
          context.items.push(item);
        }
        break;
    }
    return context;
  }

  // ─── Rendu ───────────────────────────────────────────────────────────────────

  _onRender(context, options) {
    super._onRender(context, options);
    console.log(context)
    // Onglet persistant
    const activeTab = localStorage.getItem(`activeTab-${this.actor.id}`) ?? "config";
    this._setActiveTab(activeTab);
    this.element.querySelectorAll(".sheet-tabs [data-tab]").forEach(tab => {
      tab.addEventListener("click", e => this._setActiveTab(e.currentTarget.dataset.tab));
    });

    // Cercles de progression
    this.element.querySelectorAll(".circle").forEach(circle => {
      const [cur, max] = [...circle.querySelectorAll("input")].map(i => parseFloat(i.value) || 0);
      if (max === 0) return;
      const pct = Math.min(100, Math.max(0, (cur / max) * 100));
      circle.style.background = `conic-gradient(
        var(--couleur-rouge) 0%,
        var(--couleur-bleuelect) ${pct - 1}%,
        var(--couleur-gris) ${pct}% 100%
      )`;
    });

    // Colorisation des parties corporelles
    this.element.querySelectorAll(".part").forEach(part => {
      const input = part.querySelector("input");
      const value = parseInt(input?.value) || 0;
      const name  = input?.getAttribute("name")?.split(".").pop();
      if (!name) return;
      const circle = this.element.querySelector(`.${name}`);
      if (!circle) return;
      if      (value < 5) circle.style.fill = "var(--couleur-vert)";
      else if (value < 7) circle.style.fill = "var(--couleur-orange)";
      else if (value < 9) circle.style.fill = "var(--couleur-rouge)";
      else                circle.style.display = "none";
    });

    // Filtre inventaire actif
    const inventory = this.actor.system.inventory;
    if (["all","weapon","armor","shield","item"].includes(inventory)) {
      const el = this.element.querySelector(`div[data-type="${inventory}"]`);
      if (el) el.style.border = "solid 1px var(--couleur-bleuelect)";
    }

    // Affichage mutant / couleur principale
    const mutant = this.actor.system.mutant;
    const mutantEls = this.element.querySelectorAll(".mutant");
    if (mutant === "No") {
      mutantEls.forEach(el => el.style.display = "none");
      this.element.style.setProperty("--couleur-bleuelect", "#00f7ff");
    } else {
      this.element.style.setProperty("--couleur-bleuelect", "green");
    }

    if (this.actor.system.health === 0) {
      this.element.style.setProperty("--couleur-bleuelect", "red");
    }

    // Colorisation compétences
    this.element.querySelectorAll(".perso").forEach(compt => {
      const input = compt.querySelector("input");
      if (!input) return;
      const valor = parseInt(input.value, 10) || 0;
      if      (valor === 0) { input.style.background = "var(--couleur-gris)"; input.style.color = "var(--couleur-bleuelect)"; }
      else if (valor  >  0) { input.style.background = "var(--couleur-vert)"; input.style.color = "white"; }
      else                  { input.style.background = "var(--couleur-rouge)"; input.style.color = "white"; }
    });

    this._onVerif();
  }

  _setActiveTab(tabId) {
    if (!this.actor) return;
    localStorage.setItem(`activeTab-${this.actor.id}`, tabId);

    this.element.querySelectorAll(".tab").forEach(t => t.style.display = "none");
    this.element.querySelector(`.tab[data-tab="${tabId}"]`)?.style.setProperty("display", "block");

    this.element.querySelectorAll(".sheet-tabs [data-tab]").forEach(t => t.classList.remove("active"));
    this.element.querySelector(`.sheet-tabs [data-tab="${tabId}"]`)?.classList.add("active");

    if (!game.user.isGM) {
      this.element.querySelectorAll(".reponse").forEach(el => el.style.display = "none");
    }
  }

  // ─── Drop ────────────────────────────────────────────────────────────────────

  async _onDrop(event) {
    event.preventDefault();
    const data = TextEditor.getDragEventData(event);
    if (data.type !== "Item") return;
    const item = await Item.fromDropData(data);
    if (item) await this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
  }

  // ─── Vérifications et calculs ────────────────────────────────────────────────

  async _onVerif() {
    const { race, metier, level, healthmax, competences } = this.actor.system;
    const bonusRace   = RaceBonus[race]   || {};
    const bonusMetier = MetierBonus[metier] || {};

    const updates = {};

    // Limites des compétences
    for (const [nom, valRaw] of Object.entries(competences)) {
      const valeur = parseInt(valRaw) || 0;
      const bonus  = (bonusRace[nom] ?? 0) + (bonusMetier[nom] ?? 0) + (race === "Humain" ? 10 : 0);
      const min    = -30 + bonus;
      const max    = Math.min(50, 30 + bonus);
      if      (valeur < min) updates[`system.competences.${nom}`] = min;
      else if (valeur > max) updates[`system.competences.${nom}`] = max;
    }

    // Points restants au niveau 1
    if (level === 1) {
      const raceBonus = ["Draconien","Humain"].includes(race) ? 30 : 60;
      const spent = Object.values(competences).reduce((s, v) => s + (parseInt(v) || 0), 0);
      updates["system.pointrestant"] = (level - 1) * 10 + raceBonus - spent - (healthmax - 20);
    }

    // Encombrement
    const force  = parseInt(competences.force) || 0;
    let encmax   = force / 2 + 35;
    let enc      = 0;
    let exosquelette = false, logistique = false, maitre = false;

    const itemUpdates = [];

    for (const item of this.actor.items) {
      const qty   = item.system.quantity || 0;
      const poids = item.system.poids    || 0;
      enc += poids * qty;

      const equip  = item.system.equip;
      const nameLc = item.name.toLowerCase();
      if (equip === "middle"  && nameLc === "exosquelette")        exosquelette = true;
      if (nameLc === "logistique optimisée")                       logistique   = true;
      if (nameLc === "maître du fret")                             maitre       = true;

      // Icônes d'équipement dans la liste
      if (equip) {
        const el = this.element.querySelector(`li[data-item-id="${item.id}"] .zonecontrolegauche .${equip}`);
        if (el) el.style.opacity = "1";
      }

      // Synchro armure / bouclier
      const armor  = this.actor.system.armor;
      const shield = this.actor.system.shield;
      if      (equip === "middle")   itemUpdates.push(item.update({ "system.pv": armor }));
      else if (equip === "ceinture") itemUpdates.push(item.update({ "system.pv": shield }));
    }

    if (exosquelette) encmax *= 2;
    if (logistique)   encmax *= 2;
    if (maitre)       enc    =  0;

    updates["system.enc"]    = Math.round(enc * 10) / 10;
    updates["system.encmax"] = encmax;

    if (itemUpdates.length) await Promise.all(itemUpdates);
    if (Object.keys(updates).length) await this.actor.update(updates);
  }

  // ─── Compétences métier ──────────────────────────────────────────────────────

  async getCompetencesMetier(metier, competencesActuelles) {
    // Construire la map des niveaux possédés par groupe de prérequis
    const niveauxMap = new Map();
    for (const c of competencesActuelles) {
      const key = c.system.prerequis;
      const qty = c.system.quantity ?? 1;
      if (qty > (niveauxMap.get(key) ?? 0)) niveauxMap.set(key, qty);
    }

    const pack = game.packs.get("libersf.competences");
    if (!pack) return [];
    const docs = await pack.getDocuments();

    return docs
      .filter(item => {
        if (item.system.metier !== metier) return false;
        const key    = item.system.prerequis;
        const niveau = item.system.quantity ?? 1;
        return niveau === (niveauxMap.get(key) ?? 0) + 1;
      })
      .map(item => {
        item.biographyPlain = (item.system.biography ?? "").replace(/<[^>]*>/g, "");
        return item;
      });
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────

  static async #initializerNiveau1(event, target) {
    const { race, metier, competences } = this.actor.system;
    const bonusRace   = RaceBonus[race]   || {};
    const bonusMetier = MetierBonus[metier] || {};

    const updates = Object.fromEntries(
      Object.keys(competences).map(nom => [
        `system.competences.${nom}`,
        (bonusRace[nom] ?? 0) + (bonusMetier[nom] ?? 0)
      ])
    );
    await this.actor.update({ ...updates, "system.credit": 500 });
  }

  static #onItemEdit(event, target) {
    this.actor.items.get(target.dataset.itemId)?.sheet.render(true);
  }

  static async #onItemDelete(event, target) {
    await this.actor.items.get(target.dataset.itemId)?.delete();
  }

  static async #onItemUse(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    if (!item) return;
    item.system.quantity > 1
      ? await item.update({ "system.quantity": item.system.quantity - 1 })
      : await item.delete();
  }

  static async #addCompt(event, target) {
    const actor = this.document;
    const selectEl  = target.closest(".tab, .window-content, form")
                            ?.querySelector("select[name='system.competenceschoix']");
    const selectedId = selectEl?.value;
    if (!selectedId) { ui.notifications.warn("Aucune compétence sélectionnée."); return; }

    const pack = game.packs.get("libersf.competences");
    if (!pack) { ui.notifications.error("Compendium libersf.competences introuvable."); return; }

    const itemData = await pack.getDocument(selectedId);
    if (!itemData) { ui.notifications.error("Compétence introuvable dans le compendium."); return; }

    const { prerequis: typePrereq, quantity: niveauItem = 1 } = itemData.system;
    const dejaPresent = actor.items.some(
      i => i.type === "competence" && i.system.prerequis === typePrereq && i.system.quantity === niveauItem
    );
    if (dejaPresent) {
      ui.notifications.warn(`Une compétence ${typePrereq} de niveau ${niveauItem} est déjà présente.`);
      return;
    }

    await actor.createEmbeddedDocuments("Item", [itemData.toObject()]);
    ui.notifications.info(`${itemData.name} (Niv ${niveauItem}) ajoutée avec succès.`);
    await actor.update({ "system.competenceschoix": "" });
  }

  static async #onItemRollSave(event, target) {
    await this.actor.rollSave(target.dataset.ability);
  }

  static async #onItemRollDamage(event, target) {
    const compt  = target.dataset.compt;
    const actor  = this.actor;
    const roll   = await new Roll("1d100").roll();
    const bonus  = parseInt(actor.system.bonus) || 0;
    const solitude  = parseInt(actor.system.solitude) || 0;
    const valeur = actor.system.competences[compt];
    const label  = game.i18n.localize(`Liber.Character.Competences.${compt}`);

    const CRITIQUE = 5, ECHEC = 95, BASE = 30;
    // "Esprit d'Acier" divise le malus de solitude par 2
    const espritAcier = actor.items.some(i => i.name === "Esprit d'Acier");
    const sangfroid = actor.items.some(i => i.name === "Sang-froid");
    // Sang-froid ignore le premier point de solitude
    const solitudeEffective = sangfroid
      ? Math.max(0, solitude - 1)
      : solitude;

    const ptsolitude = espritAcier
      ? Math.floor(solitudeEffective * 10 / 2)
      : solitudeEffective * 10;
      
    let valuemax = BASE + valeur + bonus - ptsolitude;
    let result   = roll.total;
    let info     = "";
    let infoarme = "";
    let infodegat;
    let techno   = 0; // valeur numérique directe
    let dommage;
    let weapon;
    //malus de point de solitude
    if (solitude > 0) {
      const mention = espritAcier ? game.i18n.localize(`Liber.Roll.ModesTir.espritdacier`) : "";console.log(espritAcier,mention)
      infoarme = game.i18n.localize(`Liber.Roll.ModesTir.solitude`) + ` : -${ptsolitude}<br>${mention}<br>`;
    }


    // ── Tir ──────────────────────────────────────────────────────────
    if (compt === "tir") {
      const weapons   = actor.items.filter(i => i.type === "weapon" && i.system.equip);
      const chargeurs = actor.items.filter(i => i.type === "item"   && i.system.equip);

      if (!weapons.length) { ui.notifications.warn("Aucune arme équipée !"); return; }

      const TIRMODES = Object.fromEntries(
        ["coup_par_coup","assommante","continu","rafale","dispertion","lourd","hors_map","automatique","couverture"]
          .map(k => [k, game.i18n.localize(`Liber.Roll.ModesTir.${k}`)])
      );

      const selection = await new Promise(resolve => {
        const d = new WeaponSelectionDialog(weapons, TIRMODES);
        d._resolve = resolve;
        d.render(true);
      });
      if (!selection) return;

      const { weaponId, selectedTir } = selection;
      weapon = actor.items.get(weaponId);
      if (!weapon) { ui.notifications.error("Arme non trouvée."); return; }

      // Enrayement
      if (weapon.system.enrayer === "Yes") {
        return LiberCharacterSheet.#sendChat(actor, label, infoarme, info,
          "var(--couleur-rouge)", "var(--couleur-blanc)",
          game.i18n.localize("Liber.Items.armeenrayé")
        );
      }
      // Enrayement
      if (weapon.system.casser === "Yes") {
        return LiberCharacterSheet.#sendChat(actor, label, infoarme, info,
          "var(--couleur-rouge)", "var(--couleur-blanc)",
          game.i18n.localize("Liber.Items.armeecassé")
        );
      }

      dommage = weapon.system.degat;
      techno  = parseInt(weapon.system.techno?.replace("TECHNO","")-2)*5 || 0;

      const chargeur = chargeurs.find(c => c.system.equip === "chargeur" && c.system.quantity > 0);
      if (!chargeur) {
        ui.notifications.warn(`${weapon.name} n'a plus de munitions !`); return;
      }

      // Modes de tir
      const MODES = {
        rafale:     { munitions: 3, resultMod: -5, infoKey: "rafale",    dommageBonus: 5 },
        dispertion: { munitions: 3, resultMod: -5, infoKey: "dispertion" },
        automatique:{ munitions: 1, resultMod: 0,  infoKey: "automatique", dommageBonus: 10 },
        couverture: { munitions:10, resultMod:-10, infoKey: "couverture" },
      };
      const mode = MODES[selectedTir];
      let munitionsPerdu = mode?.munitions ?? 1;
      if (mode?.resultMod)    result  += mode.resultMod;
      if (mode?.dommageBonus) dommage += mode.dommageBonus;
      infoarme += game.i18n.localize(`Liber.Roll.ModesTir.effetarme.${selectedTir}`)+"<br>";



      const newQty = chargeur.system.quantity - munitionsPerdu;
      const upd    = { "system.quantity": newQty };
      if (newQty <= 0) {
        upd["system.equip"] = "";
        ui.notifications.info(`${chargeur.name} est vide et a été déséquipé.`);
      } else {
        ui.notifications.info(`${munitionsPerdu} munition(s) retirée(s) de ${chargeur.name}.`);
      }
      await chargeur.update(upd);
    }
    // ── Compétences techniques ────────────────────────────────────────
    else if (["artisanat","balistique","mecanique","navigation","pilotage","piratage","science","visee"].includes(compt)) {
      techno = (parseInt(await new Promise(resolve => {
        const d = new TechLevelDialog();
        d._resolve = resolve;
        d.render(true);
      }))-2)*5 || 0;

    }

    // ── Maîtrise technologique ────────────────────────────────────────
    const SKILL_MAP = { tir:"balistique", mecanique:"mecanique", artisanat:"artisanat", pilotage:"pilotage", piratage:"piratage" };
    const techKey   = SKILL_MAP[compt] ?? null;
    let maitrise    = techKey ? Math.floor(actor.system.competences[techKey] ) : 0;
    if (actor.system.race === "elfen") maitrise += 2;


    const diff = techno - maitrise;

    if (diff > 30) { ui.notifications.warn("Technologie trop avancée pour être utilisée."); return; }
    if (diff > 0) {
      valuemax -= diff;
      infoarme+=`-${diff} techno<br>`;
      info = `<b title="(-${diff} techno)">`;
    } else {
      info = "<b>";
    }
    valuemax = Math.max(0, valuemax);
    info += `${result}/${valuemax}</b>`;

    // ── Résultat dommages ─────────────────────────────────────────────
    if (compt === "tir") {
      if      (result > ECHEC)           { infodegat = game.i18n.localize("Liber.Roll.Degat.Inutilisable"); weapon.update({ "system.casser": "Yes" }); }
      else if (result > valuemax + 20)  { infodegat = game.i18n.localize("Liber.Roll.Degat.Enraye"); weapon.update({ "system.enrayer": "Yes" }); }
      else if (result > valuemax)        infodegat = game.i18n.localize("Liber.Roll.Nodommage");
      else if (result > valuemax - 20)   infodegat = dommage;
      else if (result > CRITIQUE)        infodegat = dommage * 1.5;
      else                               infodegat = dommage * 2;
    } else if (compt === "visee") {
      if      (result > ECHEC)           infodegat = game.i18n.localize("Liber.Roll.Degat.Inutilisable");
      else if (result > valuemax + 20)   infodegat = game.i18n.localize("Liber.Roll.Degat.Enraye");
      else if (result > valuemax)        infodegat = game.i18n.localize("Liber.Roll.Nodommage");
      else if (result > valuemax - 20)   infodegat = "Degat normal";
      else if (result > CRITIQUE)        infodegat = "Degat x1.5";
      else                               infodegat = "Degat x2";
    }

    // ── Succès / échec ────────────────────────────────────────────────
    let succes, color, colors;
    if (result > ECHEC || valuemax === 0) {
      succes = game.i18n.localize("Liber.Roll.EchecCrit");  color = "var(--couleur-rouge)";     colors = "var(--couleur-blanc)";
    } else if (result <= CRITIQUE) {
      succes = game.i18n.localize("Liber.Roll.ReussiteCrit"); color = "var(--couleur-vert)";    colors = "var(--couleur-blanc)";
    } else if (result <= valuemax) {
      succes = game.i18n.localize("Liber.Roll.Reussite");    color = "var(--couleur-bleuelect)"; colors = "var(--couleur-gris)";
    } else {
      succes = game.i18n.localize("Liber.Roll.Echec");       color = "var(--couleur-orange)";   colors = "var(--couleur-blanc)";
    }

    await LiberCharacterSheet.#sendChat(actor, label, infoarme, info, color, colors, succes, infodegat);
  }

  /** Factorisation de l'envoi de message de dé */
  static async #sendChat(actor, introText, infoarme, info, color, colors, succes, infodegat = undefined) {
    const chatData = {
      actingCharName: actor.name,
      actingCharImg:  actor.img,
      info, introText, infoarme, infodegat, color, colors, succes
    };
    const chat = await new LiberChat(actor)
      .withTemplate("systems/libersf/templates/chat/roll-dammage.hbs")
      .withContent("rollDamage")
      .withData(chatData)
      .create();
    await chat.display();
  }

  static async #onKit(event, target) {
    const pack = game.packs.get("libersf.inventaire");
    if (!pack) { ui.notifications.error("Compendium 'libersf.inventaire' introuvable."); return; }

    const NAMES = new Set([
      "Couteau","Main nue","Pistolet léger","Fusil à pompe",
      "Munitions Fusil à pompe","Munitions Pistolet léger",
      "Grenade","Armure légere","Champ de force léger"
    ]);
    const AMMO = new Set(["Munitions Fusil à pompe","Munitions Pistolet léger"]);

    const docs  = await pack.getDocuments();
    const items = docs
      .filter(e => NAMES.has(e.name))
      .map(e => { const c = e.toObject(); c.system.quantity = AMMO.has(c.name) ? 10 : 1; return c; });

    try {
      await this.actor.createEmbeddedDocuments("Item", items, { renderSheet: false });
      ui.notifications.info(`${items.length} objet(s) ajouté(s) !`);
    } catch (err) {
      console.error("Erreur ajout objets :", err);
      ui.notifications.error("Erreur lors de l'ajout des objets.");
    }
  }

  static async #onItemEquip(event, target) {
    const { itemId, ou: loc, protection, protectionMax } = target.dataset;
    if (loc === "middle")   await this.actor.update({ "system.armor":  protection, "system.armormax":  protectionMax });
    if (loc === "ceinture") await this.actor.update({ "system.shield": protection, "system.shieldmax": protectionMax });
    await this.actor.items.get(itemId)?.update({ "system.equip": loc });
  }

  static async #onItemDesequip(event, target) {
    const { itemId, ou: loc } = target.dataset;
    if      (loc === "middle")   await this.actor.update({ "system.armor": 0, "system.armormax": 0 });
    else if (loc === "ceinture") await this.actor.update({ "system.shield": 0, "system.shieldmax": 0 });
    await this.actor.items.get(itemId)?.update({ "system.equip": "" });
  }

  static async #onFiltre(event, target) {
    await this.actor.update({ "system.inventory": target.dataset.type });
  }

  static async #onEditImage(event, target) {
    const attr    = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const { img } = this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ?? {};
    return new FilePicker({
      current,
      type: "image",
      redirectToRoot: img ? [img] : [],
      callback: path => this.document.update({ [attr]: path }),
      top: this.position.top + 40,
      left: this.position.left + 10,
    }).browse();
  }
}