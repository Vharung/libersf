const ActorSheetV2 = foundry.applications.sheets.ActorSheetV2;
const { HandlebarsApplicationMixin } = foundry.applications.api;
import LiberChat from "../document/chat.js";

/** Gestion de la feuille de personnage */

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
      filtre:LiberVehiculeSheet.#onFiltre,
      filtrev:LiberVehiculeSheet.#onFiltres,
      equip: LiberVehiculeSheet.#onItemEquip,
      desequip: LiberVehiculeSheet.#onItemDesequip,
      fulldown: LiberVehiculeSheet.#onFullDown
    }
  };

  /** @override */
  static PARTS = {
    header: { template: "systems/libersf/templates/actors/vehicule-header.hbs" },
    tabs: { template: "systems/libersf/templates/actors/character-navigation.hbs"},
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
    return tabs;;
  }

  /** Préparation des données */
  async _prepareContext() {
    console.log("Préparation du contexte de la feuille de personnage...");
    const filter = this.document.system.inventory;
    const filterV = this.document.system.inventoryv;
    const items = this.document.items.toObject();

    let armorpvmax, shieldpvmax;

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
      visibleItems:visibleItems,
      visibleItemsV:visibleItemsV,
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
    const armor =this.actor.system.armor;
    const armormax =this.actor.system.armormax;
    const shield =this.actor.system.shield;
    const shieldmax =this.actor.system.shieldmax;
    const hautValue =this.actor.system.haut;
    const droiteValue =this.actor.system.droite;
    const basValue =this.actor.system.bas;
    const gaucheValue =this.actor.system.gauche;
    const amorValue=armor*100/armormax;
    if(amorValue<25){
        this.element.style.setProperty('--couleur-bleuelect', 'red');
    }else if(amorValue<50){
        this.element.style.setProperty('--couleur-bleuelect', '#ff6c00');
    }else if(amorValue<75){
        this.element.style.setProperty('--couleur-bleuelect', '#56853b');
    }else{
        this.element.style.setProperty('--couleur-bleuelect', '#00f7ff');
    }

    //couleur du champ de force
    if (shield > shieldmax) {
      this.element.querySelectorAll('.part-vehicule input').forEach(el => {
        el.style.border = '1px solid var(--couleur-rouge)';
      });
    }

    const champ= this.element.querySelector(".vehicule-status");
    /*if(shield==0){ 
        champ.style.border='solid 3px var(--couleur-grisclair)';
    }*/
    const quart = shieldmax / 4;
    const moitie = shieldmax / 2;
    let color='var(--couleur-bluelect)'
    // Exemple : élément principal

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

      if (value ==0) {
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


    _onVerif(){
        let ia = this.actor.system.modeleIA;    // "M10" -> 10
        let moteur = this.actor.system.modeleMoteur; 
        let blindage = this.actor.system.modeleBlindage;
        const taille=this.actor.system.taillevehicule;
        const type=this.actor.system.typevehicule;
        const usage=this.actor.system.usage;
        ia=Number(ia.substring(1));
        moteur=Number(moteur.substring(1));
        blindage=Number(blindage.substring(1));

        //pour moteur, ia et blindage passer de M1 à 1 (ne garder que les chiffres)
        let sun1 = moteur / 2;
        let sun2 = ia / 2 + sun1;
        let sun3 = ia / 2 - 1;
        let sun4 = ia / 2 + 1;
        let technogeneral = (sun1 + sun2 + sun3 + sun4) / 4;

        function determinerSun(valeur) {
            if (valeur == 0) {
                return "";
            } else if (valeur <= 0.5) {
                return "<span>✬</span>";
            } else if (valeur <= 1) {
                return "<span>★</span>";
            } else if (valeur <= 1.5) {
                return "<span>★</span><span>✬</span>";
            } else if (valeur <= 2) {
                return "<span>★</span><span>★</span>";
            } else if (valeur <= 2.5) {
                return "<span>★</span><span>★</span><span>✬</span>";
            } else if (valeur <= 3) {
                return "<span>★</span><span>★</span><span>★</span>";
            } else if (valeur <= 3.5) {
                return "<span>★</span><span>★</span><span>★</span><span>✬</span>";
            } else if (valeur <= 4) {
                return "<span>★</span><span>★</span><span>★</span><span>★</span>";
            } else if (valeur <= 4.5) {
                return "<span>★</span><span>★</span><span>★</span><span>★</span><span>✬</span>";
            } else {
                return "<span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>";
            }
        }

        // Conserve la valeur numérique pour technogeneral
        technogeneral = determinerSun(technogeneral);

        // Applique les étoiles seulement aux valeurs individuelles
        sun1 = determinerSun(sun1);
        sun2 = determinerSun(sun2);
        sun3 = determinerSun(sun3);
        sun4 = determinerSun(sun4);

        let add=0;
        let coef=1;
        let nbtaille=1;
        let nbpiece=0;

        //cout de l'equipement
        const items = this.document.items.toObject();
        let equipementv = items.filter(item => item.type == "weaponvehicule" || item.type == "room");
        let countWeaponVehicule = 0;
        let countRoom = 0;
        items.forEach(item => {
          const qty = item.system?.quantity || 0;
          if (item.type === "weaponvehicule") {
            countWeaponVehicule += qty;
          } else if (item.type === "room") {
            countRoom += qty;
          }
        });

        // Additionner toutes les valeurs "system.valeur" des objets filtrés
        let totalValeur = equipementv.reduce((sum, item) => sum + (item.system.valeur || 0), 0);

        //Affichage background selon type de vaisseau, coef multiplicateur du prix et indication de la type du vaisseau
        if(type=="Air"){
            coef=300;
            add=add+3;
        }else if(type=="Terre"){
            coef=100;
            add=add+1;
        }else if(type=="Mer"){ 
            coef=200;
            add=add+2;
        }else if(type=="Space"){
            coef=400;
            add=add+4;
        }

        //Affichage background selon type de vaisseau, coef multiplicateur du prix et indication de la taille du vaisseau
        if(taille=="Leger"){
            coef=coef * 40;
            nbtaille=1;
            add=add+nbtaille;
        }else if(taille=="Moyen"){
            coef=coef * 80;
            nbtaille=2;nbpiece=2;
            add=add+nbtaille;
            
        }else if(taille=="Lourd"){
            coef=coef * 160;
            nbtaille=3;nbpiece=6;
            add=add+nbtaille;
        }else if(taille=="Meres"){
            coef=coef * 320;
            nbtaille=6;nbpiece=60;
            add=add+nbtaille;
        }
        //Calcule du prix
        const prix=(ia  + moteur + blindage + add) *coef + totalValeur; 



        //calcul blindage champ de force etc
        const armormax=blindage*(nbtaille+2)*200;
        let armor=this.actor.system.armor;
        let shieldmax=moteur*(nbtaille+2)*200;
        let nbarme= ia + blindage;
        let nrj=this.actor.system.enc;
        let nrjmax=moteur * nbtaille *200;
        let pvmoteur=this.actor.system.health;
        let pvmoteurmax=moteur * nbtaille *150;

        


        //Champ de force
        const haut=this.actor.system.haut;
        const droite=this.actor.system.droite;
        const bas=this.actor.system.bas;
        const gauche=this.actor.system.gauche;
        const shield=haut + droite + bas + gauche

        //nb inventaire
        let piece=Math.pow(nbtaille-1, 3) || 0;
        let arme=nbtaille*nbtaille+1;
        const ptia=ia * -10;

        //competence
        let total = ptia;
        const competences = this.actor.system.competences;
        for (let key in competences) {
            if (competences.hasOwnProperty(key)) {
                total += parseInt(competences[key]) || 0;
            }
        }
        //usage
        if(usage=="Combat"){
          arme=arme+2
        }else if(usage=="Exploration"){
          nrjmax=nrjmax*2;
        }else if(usage=="Commerce"){
          pvmoteurmax=pvmoteurmax*2;
        }else if(usage=="Industriel"){
          piece=piece+2; shieldmax=shieldmax*1.5;
        }

        if(nrj>nrjmax){nrj=nrjmax}
        if(pvmoteur>pvmoteurmax){pvmoteur=pvmoteurmax}
        if(nrj>nrjmax){nrj=nrjmax}
        if(armor>armormax){armor=armormax}

        const somme=shieldmax - haut - droite - bas - gauche;
        if(somme<0){
            ui.notifications.info(`Trop de points de champ de force a été attribué`); 
        }

        this.actor.update({
            "system.credit":prix,
            "system.armor":armor,
            "system.armormax":armormax,
            "system.shield":shield,
            "system.shieldmax":shieldmax,
            "system.enc":nrj,
            "system.encmax":nrjmax,
            "system.health":pvmoteur,
            "system.healthmax":pvmoteurmax,
            "system.sun1":sun1,
            "system.sun2":sun2,
            "system.sun3":sun3,
            "system.sun4":sun4,
            "system.maxpiece":piece,
            "system.maxarme":arme,
            "system.piece":countRoom,
            "system.arme":countWeaponVehicule,
            "system.pointrestant":total,
            "system.technogeneral":technogeneral
        })

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

      
      let color = "var(--couleur-bleuelect)";

      if (typeof type !== 'undefined' && typeof description !== 'undefined') {
        info = `${info}<div class="infos"><span class="title">Info</span><div class="description">${description}</div></div>`;
      }

      let selectedTir, weaponId, chargeur;
      let infoarme="";
      let dommage;


        info = `${result}/${valuemax}`;

       // Définir le message en fonction du résultat

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

    static async #onFullDown(event, target){
        const cout=target.getAttribute('data-full');
        const name=target.getAttribute('data-name');
        const actor=this.actor;
        const label=game.i18n.localize('Liber.Character.Action.Vehicule.'+name)
        let color="var(--couleur-bleuelect)";
        let succes=`${game.i18n.localize('Liber.Character.Action.Vehicule.Energie')} ${cout}`
        let full=this.actor.system.enc;
        if(full==0){
            succes=game.i18n.localize('Liber.Character.Action.Vehicule.Panne');
            color="var(--couleur-rouge)";
        }
        full = full - cout;
        if(full<0){
            succes=game.i18n.localize('Liber.Character.Action.Vehicule.Pannes');
            color="var(--couleur-orange)";
        }
        let chatData = {
          actingCharName: actor.name,
          actingCharImg: actor.img,
          introText: "",
          infoarme:label,
          color:color,
          succes: succes
        };

        let chat = await new LiberChat(this.actor)
          .withTemplate("systems/libersf/templates/chat/roll-dammage.hbs")
          .withContent("rollDamage")
          .withData(chatData)
          .create();

        await chat.display();
        if(full<0){
            return;
        }
        this.actor.update({'system.enc':full})
    }

//a voir si utile pour pilote mettre en bleuelect
   static async #onItemEquip(event, target) {
      const itemId = target.getAttribute('data-item-id');
      let equipLocation = target.getAttribute('data-ou');


      
      // Récupération de l'item
      const item = this.actor.items.get(itemId);
      if(item.system.equip=="pilote"){
        equipLocation="";
      }
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
    static async #onFiltres(event,target){
      const types=target.getAttribute('data-type');
      this.actor.update({'system.inventoryv':types})
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
