import {CHOISE, TECHNO, ENERGIE, VETEMENT, PREREQUIS, METIERS} from "./constants.js"; // Import de la constante METIERS

/** Modèle de données pour un objet */
export default class LiberItemData extends foundry.abstract.TypeDataModel  {
  static defineSchema() {
  	const fields = foundry.data.fields;
    return {
		name:new fields.StringField({ required: true, initial: "Nouvel Objet" }),
		biography: new fields.HTMLField({ required: false, blank: true, initial: "", textSearch: true }),
		quantity: new fields.NumberField({ required: true, min: 0, initial: 1 }),
		position: new fields.NumberField({ required: true, min: 0, initial: 0 }),
		degat: new fields.NumberField({ required: true, min: 0, initial: 0 }),
		prerequis:  new fields.StringField({
	        required: true,
	        initial: PREREQUIS.ACTIF, // Valeur par défaut
	        choices: {
		            [PREREQUIS.ACTIF]: game.i18n.localize("Liber.Character.Choix.Actif"),
		            [PREREQUIS.SUPPORT]: game.i18n.localize("Liber.Character.Choix.Support"),
		            [PREREQUIS.PASSIF]: game.i18n.localize("Liber.Character.Choix.Passif"),
		            [PREREQUIS.SPECIALISATION]: game.i18n.localize("Liber.Character.Choix.Specialisation")
	        	}
	    }),
		porter: new fields.NumberField({ required: true, min: 0, initial: 0 }),
		rayon: new fields.NumberField({ required: true, min: 0, initial: 0 }),
		poids: new fields.NumberField({ required: true, min: 0, initial: 0 }),
		valeur: new fields.NumberField({ required: true, min: 0, initial: 0 }),
		protec: new fields.NumberField({ required: true, min: 0, initial: 0 }),
		pv: new fields.NumberField({ required: true, min: 0, initial: 0 }),
		pvmax: new fields.NumberField({ required: true, min: 0, initial: 0 }),
		equip: new fields.HTMLField({ required: false, initial: "" }),
		consommable: new fields.StringField({
	        required: true,
	        initial: CHOISE.NO, // Valeur par défaut
	        choices: {
		            [CHOISE.NO]: game.i18n.localize("Liber.Character.Choix.No"),
		            [CHOISE.YES]: game.i18n.localize("Liber.Character.Choix.Yes")
	        	}
	    }),
	    enrayer: new fields.StringField({
	        required: true,
	        initial: CHOISE.NO, // Valeur par défaut
	        choices: {
		            [CHOISE.NO]: game.i18n.localize("Liber.Character.Choix.No"),
		            [CHOISE.YES]: game.i18n.localize("Liber.Character.Choix.Yes")
	        	}
	    }),
	    casser: new fields.StringField({
	        required: true,
	        initial: CHOISE.NO, // Valeur par défaut
	        choices: {
		            [CHOISE.NO]: game.i18n.localize("Liber.Character.Choix.No"),
		            [CHOISE.YES]: game.i18n.localize("Liber.Character.Choix.Yes")
	        	}
	    }),
	    techno: new fields.StringField({
		    required: true,
		    initial: "TECHNO0",  // correspond à la clé
		    choices: {
	        TECHNO0: TECHNO.TECHNO0,
	        TECHNO1: TECHNO.TECHNO1,
	        TECHNO2: TECHNO.TECHNO2,
	        TECHNO3: TECHNO.TECHNO3,
	        TECHNO4: TECHNO.TECHNO4,
	        TECHNO5: TECHNO.TECHNO5,
	        TECHNO6: TECHNO.TECHNO6,
	        TECHNO7: TECHNO.TECHNO7,
	        TECHNO8: TECHNO.TECHNO8,
	        TECHNO9: TECHNO.TECHNO9,
	        TECHNO10: TECHNO.TECHNO10
			  }
		}),
	    contents: new fields.ArrayField(//ajoute contenu
        new fields.SchemaField({
          id: new fields.StringField({ required: true }),   // ID de l'item contenu
          name: new fields.StringField({ required: true }), // Nom de l'item
          qty: new fields.NumberField({ required: true, min: 1, initial: 1 })
        }),
        { initial: [] }
      ),
			energie: new fields.StringField({
			 	required: true,
        initial: ENERGIE.CINETIQUE, // Valeur par défaut
        choices: {
          [ENERGIE.CINETIQUE]: game.i18n.localize("Liber.Items.Energies.Cinetique"),
          [ENERGIE.ENERGIE]: game.i18n.localize("Liber.Items.Energies.Energie"),
          [ENERGIE.LASER]: game.i18n.localize("Liber.Items.Energies.Laser"),
          [ENERGIE.PLASMA]: game.i18n.localize("Liber.Items.Energies.Plasma"),
          [ENERGIE.SON]: game.i18n.localize("Liber.Items.Energies.Son")
      	}
			}),
			vetement: new fields.StringField({
			required: true,
	        initial: VETEMENT.ARMOR, // Valeur par défaut
	        choices: {
	          [VETEMENT.ARMOR]: game.i18n.localize("Liber.Items.Vetement.Armure"),
	          [VETEMENT.COMBI]: game.i18n.localize("Liber.Items.Vetement.Combinaison"),
	          [VETEMENT.TENUE]: game.i18n.localize("Liber.Items.Vetement.Tenue")
      		}
		}),
		metier: new fields.StringField({
        required: true,
        initial: METIERS.SOLDAT, // Valeur par défaut
	        choices: {
	          [METIERS.SOLDAT]: game.i18n.localize("Liber.Character.Metier.Soldat"),
	          [METIERS.INGENIEUR]: game.i18n.localize("Liber.Character.Metier.Ingenieur"),
	          [METIERS.HACKER]: game.i18n.localize("Liber.Character.Metier.Hacker"),
	          [METIERS.MEDECIN]: game.i18n.localize("Liber.Character.Metier.Medecin"),
	          [METIERS.DIPLOMATE]: game.i18n.localize("Liber.Character.Metier.Diplomate"),
	          [METIERS.MERCENAIRE]: game.i18n.localize("Liber.Character.Metier.Mercenaire"),
	          [METIERS.CHASSEUR]: game.i18n.localize("Liber.Character.Metier.Chasseur"),
	          [METIERS.ECLAIREUR]: game.i18n.localize("Liber.Character.Metier.Eclaireur"),
	          [METIERS.SCIENTIFIQUE]: game.i18n.localize("Liber.Character.Metier.Scientifique"),
	          [METIERS.CONTREBANDIER]: game.i18n.localize("Liber.Character.Metier.Contrebandier"),
	          [METIERS.PILOTE]: game.i18n.localize("Liber.Character.Metier.Pilote"),
	          [METIERS.TOUS]: game.i18n.localize("Liber.Character.Metier.Tous")
	          
	        }
	      }),
		champ: new fields.StringField({
			 	required: true,
        initial: VETEMENT.CHAMP, // Valeur par défaut
	        choices: {
	          [VETEMENT.CHAMP]: game.i18n.localize("Liber.Items.Vetement.Champ"),
	          [VETEMENT.BOUCL]: game.i18n.localize("Liber.Items.Vetement.Boucl")
	      	}
		})
    };
  }
}