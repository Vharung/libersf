const ActorSheetV2 = foundry.applications.sheets.ActorSheetV2;
const { HandlebarsApplicationMixin } = foundry.applications.api;
import LiberChat from "../document/chat.js";

/** Gestion de la feuille de personnage */

export default class LiberMonsterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["liber", "actor", "character"],
    position: { width: 500, height: 900 },
    form: { submitOnChange: true },
    window: { resizable: true },
    dragDrop: [{ dragSelector: '[data-drag]', dropSelector: '.inventory-list' }], // Remplacer '.inventory-list' par votre sélecteur    tabGroups: { sheet: "inventory" },
    actions: {
      editImage: LiberMonsterSheet.#onEditImage,
      edit: LiberMonsterSheet.#onItemEdit,
      delete: LiberMonsterSheet.#onItemDelete,
      rollSave: LiberMonsterSheet.#onItemRollSave,
      rollDamage: LiberMonsterSheet.#onItemRollDamage,
      filtre:LiberMonsterSheet.#onFiltre,
      equip: LiberMonsterSheet.#onItemEquip,
      desequip: LiberMonsterSheet.#onItemDesequip
    }
  };

  /** @override */
  static PARTS = {
    header: { template: "systems/libersf/templates/actors/monster-header.hbs" },
    tabs: { template: "systems/libersf/templates/actors/character-navigation.hbs"},
    stat: { template: "systems/libersf/templates/actors/character-stat.hbs" },
    biography: { template: "systems/libersf/templates/actors/monster-biography.hbs" },
    inventory: { template: "systems/libersf/templates/actors/character-inventory.hbs" },
    competence: { template: "systems/libersf/templates/actors/character-competence.hbs" }
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
    return tabs;;
  }

  /** Préparation des données */
  async _prepareContext() {
    console.log("Préparation du contexte de la feuille de personnage...");
    const filter = this.document.system.inventory;
    const items = this.document.items.toObject();

    let armorpvmax, shieldpvmax;

    // Initialiser les listes d'équipement
    let filteredItems = {
        droite: [],
        gauche: [],
        middle: [],
        ceinture: [],
        chargeur: [],
        autres: []
    };

    // Répartir les objets selon leur emplacement d'équipement
    items.forEach(item => {
        const equipLocation = item.system?.equip;
        if (equipLocation === "droite") {
            filteredItems.droite.push(item);
        } else if (equipLocation === "gauche") {
            filteredItems.gauche.push(item);
        } else if (equipLocation === "middle") {
            filteredItems.middle.push(item);
        } else if (equipLocation === "ceinture") {
            filteredItems.ceinture.push(item);
        } else if (equipLocation === "chargeur") {
            filteredItems.chargeur.push(item);
        } else {
            filteredItems.autres.push(item);
        }
    });

    // Trier les compétences
    let competence = items
        .filter(item => item.type === "competence")
        .sort((a, b) => a.system.quantity - b.system.quantity);

    // Appliquer le filtre d'affichage général
    let visibleItems;
    if (filter === "all") {
        visibleItems = items.filter(item => item.type !== "competence");
    } else {
        visibleItems = items.filter(item => filter.includes(item.type));
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
      inventory:filteredItems,
      visibleItems:visibleItems,
      competence:competence,
      source: this.document.toObject(),
      items: this.document.items.toObject(),
      img // On utilise l'image corrigée
    };
    
  }


  async _preparePartContext(partId, context) {
    const doc = this.document;
    switch (partId) {
      case "biography":
        context.tab = context.tabs.biography;
        context.enrichedBiography = await TextEditor.enrichHTML(this.document.system.biography, { async: true });
        break;
      case "inventory":
        context.tab = context.tabs.inventory;
        context.items = [];
        const itemsRaw = this.document.items;
        for (const item of itemsRaw) {
            item.enrichedDescription = await TextEditor.enrichHTML(item.system.description, { async: true });
            context.items.push(item);
      }
      break;
    }
    return context;
  }

  async _onRender(context, options) {
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
        const nameAttr=part.querySelector("input").getAttribute("name");  // récupère system.nom
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
            circle.style.display = 'none';
        }
    });

    // Tab inventaire
    const inventory = this.actor.system.inventory;
    const types = ["all", "weapon", "armor", "shield", "item"];

    if (types.includes(inventory)) {
        const activeTab = document.querySelector(`div[data-type="${inventory}"]`);
        if (activeTab) {
            activeTab.style.border = "solid 1px var(--couleur-bleuelect)";
        }
    }

    //*Affichage icone mutant*//
    const mutant = this.actor.system.mutant;
    const mutantElements = this.element.querySelectorAll('.mutant');
    if (mutant === "No") {
        mutantElements.forEach(element => {
            element.style.display = 'none';
        });
        this.element.style.setProperty('--couleur-bleuelect', '#00f7ff');
    }else{
      this.element.style.setProperty('--couleur-bleuelect', 'green');
    }

    /*plus de PV*/
    const pv =this.actor.system.health;
    if(pv==0){
      this.element.style.setProperty('--couleur-bleuelect', 'red');
    }

    /*Colorise les compétences*/
    document.querySelectorAll(".perso").forEach(compt => {
      const input = compt.querySelector("input");
      const spanElement = compt.querySelector("span");
      const calc = compt.querySelector("span[calc]").getAttribute("calc");
      const span = spanElement ? spanElement.innerHTML : ""; // Vérifie si <a> existe
      const valor = parseInt(input?.value, 10) || 0; // Vérifie si input existe et parse en nombre
      const dataAbility = compt.getAttribute('data-ability'); // Récupère la valeur de data-ability du parent .perso
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
    const type=this.actor.type;
    await this._onVerif()
     // Calcul de l'encombrement
    

    
  }

  async _onVerif() {
    const force = parseInt(this.actor.system.competences.force) || 0;
    const taille = this.actor.system.taille || "moyen";
    const items = this.actor.items;

    let encmax = force / 2;
    let enc = 0;

    // Ajustement de l'encmax selon la taille
    switch (taille) {
      case "mini":
        encmax = 0;
        break;
      case "petit":
        encmax += 5;
        break;
      case "moyen":
        encmax += 35;
        break;
      case "grand":
        encmax += 70;
        break;
      case "geant":
        encmax *= 2;
        break;
    }

    // Calcul de l'encombrement total
    items.forEach(item => {
      if (!item.system) return;

      const quantity = item.system.quantity || 0;
      const poids = item.system.poids || 0;
      enc += poids * quantity;

      const equip = item.system.equip;
      const itemid = item.id;

      if (equip) {
        const element = this.element.querySelector(`li[data-item-id="${itemid}"] .zonecontrolegauche .${equip}`);
        if (element) {
          element.style.opacity = "1";
        }
      }
    });

    // Mise à jour de l'acteur
    const updatesActeur = {
      'system.enc': enc,
      'system.encmax': encmax,
      'system.avantagerace': ""
    };

    console.log(updatesActeur);
    await this.actor.update(updatesActeur);
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
        const roll = await this.actor.rollSave(ability);
        //console.log('roll', roll);
    }

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
     * @param {PointerEvent} event - The originating click event
     * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
     */
    static async #onItemRollDamage(event, target) {
      const compt = target.getAttribute('data-compt');
      const roll = await new Roll("1d100").roll();
      const bonus = parseInt(this.actor.system.bonus) || 0;
      const valeur = this.actor.system.competences[compt];
      const critique = 5;
      const echec = 95;
      const base = 30;
      const actor = this.actor;
      let info = "";
      let succes = "";
      let valuemax = base + valeur + bonus;
      const result = roll.total;
      const label = game.i18n.localize(`Liber.Character.Competences.${compt}`);
      let infodegat;
      let techno=0;

      
      let color = "var(--couleur-bleuelect)";

      if (typeof type !== 'undefined' && typeof description !== 'undefined') {
        info = `${info}<div class="infos"><span class="title">Info</span><div class="description">${description}</div></div>`;
      }

      let selectedTir, weaponId, chargeur;
      let infoarme="";
      let dommage;

      //si tir affiche dialog
      if (["tir"].includes(compt)) {
        const weapons = actor.items.filter(i => i.type === "weapon" && i.system.equip);
        const chargeurs = actor.items.filter(i => i.type === "item" && i.system.equip);
        const TIRMODES = {
          "coup_par_coup": game.i18n.localize("Liber.Roll.ModesTir.coup_par_coup"),
          "assommante": game.i18n.localize("Liber.Roll.ModesTir.assommante"),
          "continu": game.i18n.localize("Liber.Roll.ModesTir.continu"),
          "rafale": game.i18n.localize("Liber.Roll.ModesTir.rafale"),
          "dispertion": game.i18n.localize("Liber.Roll.ModesTir.dispertion"),
          "lourd": game.i18n.localize("Liber.Roll.ModesTir.lourd"),
          "hors_map": game.i18n.localize("Liber.Roll.ModesTir.hors_map"),
          "automatique": game.i18n.localize("Liber.Roll.ModesTir.automatique"),
          "couverture": game.i18n.localize("Liber.Roll.ModesTir.couverture"),
        };
        if (weapons.length === 0) {
          ui.notifications.warn("Aucune arme équipée !");
          return;
        }
        const selection = await this.afficherDialogueSelection(weapons, TIRMODES);
        if (!selection) return;

        //recuperer dialog
        weaponId = selection.weaponId;
        selectedTir = selection.selectedTir;

        //info arme
        const weapon = actor.items.get(weaponId);
        if (!weapon) {
          ui.notifications.error("Arme non trouvée.");
          return;
        }
        dommage=weapon.system.degat;
        techno=weapon.system.techno;
        chargeur = chargeurs.find(c => c.system.equip === "chargeur" && c.system.quantity > 0);
        if (!chargeur) {
          ui.notifications.warn(`${weapon.name} n'a plus de munitions ou aucun chargeur n'est chargé !`);
          return;
        }

        //gestion des munitions et information
        let munitionsPerdu = 1;
        if (selectedTir === "coup_par_coup"){infoarme=game.i18n.localize("Liber.Roll.ModesTir.effetarme.coup_par_coup")}
        else if (selectedTir === "assommante"){infoarme=game.i18n.localize("Liber.Roll.ModesTir.effetarme.assommante")}
        else if (selectedTir === "continu"){infoarme=game.i18n.localize("Liber.Roll.ModesTir.effetarme.continu")}
        else if (selectedTir === "rafale"){munitionsPerdu = 3;result=result - 5;infoarme=game.i18n.localize("Liber.Roll.ModesTir.effetarme.rafale");dommage=dommage+5;}
        else if (selectedTir === "dispertion"){munitionsPerdu = 3;result=result - 5;infoarme=game.i18n.localize("Liber.Roll.ModesTir.effetarme.dispertion")}
        else if (selectedTir === "lourd"){infoarme=game.i18n.localize("Liber.Roll.ModesTir.effetarme.lourd")}
        else if (selectedTir === "hors_map"){infoarme=game.i18n.localize("Liber.Roll.ModesTir.effetarme.hors_map")}
        else if (selectedTir === "automatique"){infoarme=game.i18n.localize("Liber.Roll.ModesTir.effetarme.automatique");dommage=dommage+10;}
        else if (selectedTir === "couverture"){munitionsPerdu = 10;result=result - 10;infoarme=game.i18n.localize("Liber.Roll.ModesTir.effetarme.couverture")}
        let newQty = chargeur.system.quantity - munitionsPerdu;
        let updateData = { "system.quantity": newQty };
        if (newQty <= 0) {
          updateData["system.equip"] = "";
          ui.notifications.info(`${chargeur.name} est vide et a été déséquipé.`);
        } else {
          ui.notifications.info(`${munitionsPerdu} munition(s) a été retirée de ${chargeur.name}.`);
        }
        await chargeur.update(updateData);
      }else if (["artisanat", "balistique", "mecanique", "navigation", "pilotage", "piratage", "science", "visee"].includes(compt)){
        techno = await this.afficherDialogueAbbility();
        techno="TECHNO"+techno;
      }

      //gestion des technologie 
      let technoVars = {};
      let index = parseInt(techno.replace("TECHNO", ""));
      if (!isNaN(index)) {
        if (index === 0) {
          techno = 0;
        } else {
          techno=index;
        }
      }
      if(this.actor.system.race=="elfen"){
            techno=techno + 2;
        }
      let etoilemax = 0
      let skillMap = {
            tir: "balistique",
            mecanique: "mecanique",
            artisanat: "artisanat",
            pilotage: "pilotage",
            piratage: "piratage"
        };
        let key = skillMap[compt] || (name === "balistique" ? "balistique" : null);
        if (key) {
            etoilemax = Math.floor(this.actor.system.competences[key] / 5) + 2;
        }
        let dif=etoilemax - techno ;
        if(dif>0){dif=0;}
        valuemax=valuemax + dif*5;
        info = `${result}/${valuemax}`;

       // Définir le message en fonction du résultat
      if (["tir","visee"].includes(compt)) {
            if(result>echec){
                infodegat=game.i18n.localize('Liber.Roll.Degat.Inutilisable');
            }else if(result>(valuemax+20)){
                infodegat=game.i18n.localize('Liber.Roll.Degat.Enraye');
            }else if(result>(valuemax-20)){
                infodegat=dommage;
            }else if(result>critique){
                infodegat=dommage*1.5;
            }else if(result<=critique){
                infodegat=dommage*2;
            }
        }
      if (result > echec || valuemax==0) {
          succes = game.i18n.localize("Liber.Roll.EchecCrit");
          color ='var(--couleur-rouge)';
      } else if (result <= critique) {
          succes = game.i18n.localize("Liber.Roll.ReussiteCrit");
          color ='var(--couleur-vert)';
      } else if (result <= valuemax) {
          succes = game.i18n.localize("Liber.Roll.Reussite");
          color='var(--couleur-bleuelect)';
      } else {
          succes = game.i18n.localize("Liber.Roll.Echec");
          color='var(--couleur-orange)';
      }

      // Pour affichage ou log si besoin :
      console.log(`Résultat: ${result}, Limite: ${valuemax}, Info: ${info}, Succès: ${succes}`);
      let chatData = {
          actingCharName: actor.name,
          actingCharImg: actor.img,
          info:info,
          introText: label,
          infoarme:infoarme,
          infodegat:infodegat,
          color:color,
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

   static async #onItemEquip(event, target) {
      const itemId = target.getAttribute('data-item-id');
      const equipLocation = target.getAttribute('data-ou');

      if(equipLocation=="middle"){
        const protection=target.getAttribute('data-protection');
        const protectionmax=target.getAttribute('data-protection-max');
        await this.actor.update({'system.armor':protection,'system.armormax':protectionmax});
      }
      if(equipLocation=="ceinture"){
        const protection=target.getAttribute('data-protection');
        const protectionmax=target.getAttribute('data-protection-max');
        await this.actor.update({'system.shield':protection,'system.shieldmax':protectionmax});
      }
      
      // Récupération de l'item
      const item = this.actor.items.get(itemId);
      await item.update({'system.equip':equipLocation})
    }

    static async #onItemDesequip(event, target) {  
      // Récupération de l'item
      const itemId = target.getAttribute('data-item-id');
      const item = this.actor.items.get(itemId);
      const equipLocation = target.getAttribute('data-ou');
      if(equipLocation=="middle"){
       await this.actor.update({'system.armor':0,'system.armormax':0});
      }else if(equipLocation=="ceinture"){
        await this.actor.update({'system.shield':0,'system.shieldmax':0});
      }
      await item.update({'system.equip':""})
    }

    static async #onFiltre(event,target){
      const types=target.getAttribute('data-type');
      this.actor.update({'system.inventory':types})
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
        const { img } =
            this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ??
            {};
        const fp = new FilePicker({
            current,
            type: 'image',
            redirectToRoot: img ? [img] : [],
            callback: (path) => {
                this.document.update({ [attr]: path });
            },
            top: this.position.top + 40,
            left: this.position.left + 10,
        });
        return fp.browse();
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
          element.style.display = "none"; // Corrigé "this" -> "element"
        });
      }
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
          element.style.display = "none"; // Corrigé "this" -> "element"
        });
      }
  }

}
