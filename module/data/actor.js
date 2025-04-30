import {METIERS, RACES, FACTIONS, SEX, CHOISE, COMPETENCES, ATTITUDE, TAILLE, TECHNO, TYPES, TAILLEV, IAMODEL, MOTEURMODEL, BLINDAGEMODEL, USAGE} from "./constants.js"; // Import de la constante METIERS

/** Modèle de données pour un personnage */
export default class LiberCharacterData extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      type: new foundry.data.fields.StringField({ required: true, initial: "character" }),
      name: new foundry.data.fields.StringField({ required: true, initial: "Nouvel Acteur" }),
      inventory: new foundry.data.fields.StringField({ required: true, initial: "all" }),
      inventoryv: new foundry.data.fields.StringField({ required: true, initial: "allv" }),
      compspec: new foundry.data.fields.StringField({ required: true, initial: game.i18n.localize("Liber.Character.Special") }),
      espece: new foundry.data.fields.StringField({ required: true, initial: game.i18n.localize("Liber.Character.Espece") }),
      technogeneral: new foundry.data.fields.StringField({ required: true, initial: "☆ ☆ ☆ ☆ ☆" }),
      level: new foundry.data.fields.NumberField({ required: true, min: 1, max: 100, initial: 1 }),
      health: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 10 }),
      healthmax: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 10 }),
      armor: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      armormax: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      shield: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      shieldmax: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      solitude: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      enc: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      encmax: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      credit: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      pointrestant: new foundry.data.fields.NumberField({ required: true, initial: 0 }),
      bonus: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      arme: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      maxarme: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      piece: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      maxpiece: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      biography: new fields.HTMLField({ required: false, blank: true, initial: "", textSearch: true }),
      avantagerace: new fields.HTMLField({ required: false, blank: true, initial: "+10 Diplomatie, +10 Perception, +10 Science, +10 Balistique. 10 Négociation", textSearch: true }),
      sun1: new fields.HTMLField({ required: true, initial: "" }),
      sun2: new fields.HTMLField({ required: true, initial: "" }),
      sun3: new fields.HTMLField({ required: true, initial: "" }),
      sun4: new fields.HTMLField({ required: true, initial: "" }),
      metier: new fields.StringField({
        required: true,
        initial: METIERS.MARCHAND, // Valeur par défaut
        choices: {
          [METIERS.MARCHAND]: game.i18n.localize("Liber.Character.Metier.Marchand"),
          [METIERS.ARTISAN]: game.i18n.localize("Liber.Character.Metier.Artisan"),
          [METIERS.INTELLECTUEL]: game.i18n.localize("Liber.Character.Metier.Intellectuel"),
          [METIERS.MALANDRIN]: game.i18n.localize("Liber.Character.Metier.Malandrin"),
          [METIERS.PILOTE]: game.i18n.localize("Liber.Character.Metier.Pilote"),
          [METIERS.MEDECIN]: game.i18n.localize("Liber.Character.Metier.Medecin"),
          [METIERS.MILITAIRE]: game.i18n.localize("Liber.Character.Metier.Militaire"),
          [METIERS.TECHNICIEN]: game.i18n.localize("Liber.Character.Metier.Technicien"),
          [METIERS.COMBATTANT]: game.i18n.localize("Liber.Character.Metier.Combattant")
        }
      }),
      race: new fields.StringField({
        required: true,
        initial: RACES.HUMAIN, // Valeur par défaut
        choices: {
          [RACES.HUMAIN]: game.i18n.localize("Liber.Character.Race.Humain"),
          [RACES.ARTHURIEN]: game.i18n.localize("Liber.Character.Race.Arthurien"),
          [RACES.DRAGON]: game.i18n.localize("Liber.Character.Race.Dragon"),
          [RACES.MACHINE]: game.i18n.localize("Liber.Character.Race.Machine"),
          [RACES.PLEIADIEN]: game.i18n.localize("Liber.Character.Race.Pleiadien"),
          [RACES.YORIBIEN]: game.i18n.localize("Liber.Character.Race.Yoribien"),
          [RACES.ELFEN]: game.i18n.localize("Liber.Character.Race.Elfen"),
          [RACES.ORCANIEN]: game.i18n.localize("Liber.Character.Race.Orcanien")
        }
      }),
      attitude: new fields.StringField({
        required: true,
        initial: ATTITUDE.NEUTRE, // Valeur par défaut
        choices: {
          [ATTITUDE.TRESAMICAL]: game.i18n.localize("Liber.Character.Attitude.Tresamical"),
          [ATTITUDE.AMICAL]: game.i18n.localize("Liber.Character.Attitude.Amical"),
          [ATTITUDE.NEUTRE]: game.i18n.localize("Liber.Character.Attitude.Neutre"),
          [ATTITUDE.AGRESSIF]: game.i18n.localize("Liber.Character.Attitude.Agressif"),
          [ATTITUDE.TRESAGRESSIF]: game.i18n.localize("Liber.Character.Attitude.Tresagressif")
        }
      }),
       taille: new fields.StringField({
          required: true,
          initial: TAILLE.MIDDLE, // Valeur par défaut
          choices: {
              [TAILLE.MINI]: game.i18n.localize("Liber.Character.Taille.Mini"),
              [TAILLE.SMART]: game.i18n.localize("Liber.Character.Taille.Smart"),
              [TAILLE.MIDDLE]: game.i18n.localize("Liber.Character.Taille.Middle"),
              [TAILLE.TALL]: game.i18n.localize("Liber.Character.Taille.Tall"),
              [TAILLE.BIG]: game.i18n.localize("Liber.Character.Taille.Big")
          }
      }),
      faction: new fields.StringField({
        required: true,
        initial: FACTIONS.EMPIRE, // Valeur par défaut
        choices: {
          [FACTIONS.EMPIRE]: game.i18n.localize("Liber.Character.Faction.Empire"),
          [FACTIONS.OMC]: game.i18n.localize("Liber.Character.Faction.OMC"),
          [FACTIONS.FEDERATION]: game.i18n.localize("Liber.Character.Faction.Federation"),
          [FACTIONS.PLEIADE]: game.i18n.localize("Liber.Character.Faction.Pleiade"),
          [FACTIONS.FANATIQUE]: game.i18n.localize("Liber.Character.Faction.Fanatique"),
          [FACTIONS.REBEL]: game.i18n.localize("Liber.Character.Faction.Rebel"),
          [FACTIONS.AUTRE]: game.i18n.localize("Liber.Character.Faction.Autre")
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
      sex: new fields.StringField({
        required: true,
        initial: SEX.MALE, // Valeur par défaut
        choices: {
          [SEX.MALE]: game.i18n.localize("Liber.Character.Sex.Male"),
          [SEX.FEMALE]: game.i18n.localize("Liber.Character.Sex.Female"),
          [SEX.AUTRE]: game.i18n.localize("Liber.Character.Sex.Autre")
        }
      }),
      usage: new fields.StringField({
        required: true,
        initial: USAGE.COMBAT, // Valeur par défaut
        choices: {
          [USAGE.COMBAT]: game.i18n.localize("Liber.Character.Usage.Combat"),
          [USAGE.EXPLOR]: game.i18n.localize("Liber.Character.Usage.Exploration"),
          [USAGE.COMMER]: game.i18n.localize("Liber.Character.Usage.Commerce"),
          [USAGE.INDUST]: game.i18n.localize("Liber.Character.Usage.Industriel")
        }
      }),
      typevehicule: new fields.StringField({
        required: true,
        initial: TYPES.TERRE, // Valeur par défaut
        choices: {
          [TYPES.TERRE]: game.i18n.localize("Liber.Character.Types.Terre"),
          [TYPES.AIR]: game.i18n.localize("Liber.Character.Types.Air"),
          [TYPES.MER]: game.i18n.localize("Liber.Character.Types.Mer"),
          [TYPES.SPACE]: game.i18n.localize("Liber.Character.Types.Space")
        }
      }),
      taillevehicule: new fields.StringField({
        required: true,
        initial: TAILLEV.LEGER, // Valeur par défaut
        choices: {
          [TAILLEV.LEGER]: game.i18n.localize("Liber.Character.Tailles.Leger"),
          [TAILLEV.MOYEN]: game.i18n.localize("Liber.Character.Tailles.Moyen"),
          [TAILLEV.LOURD]: game.i18n.localize("Liber.Character.Tailles.Lourd"),
          [TAILLEV.MERES]: game.i18n.localize("Liber.Character.Tailles.Meres")
        }
      }),
      mutant: new fields.StringField({
          required: true,
          initial: CHOISE.NO, // Valeur par défaut
          choices: {
            [CHOISE.NO]: game.i18n.localize("Liber.Character.Choix.No"),
            [CHOISE.YES]: game.i18n.localize("Liber.Character.Choix.Yes")
          }
      }),
      modeleIA: new fields.StringField({
        required: true,
        initial: "M1", 
        choices: Object.entries(IAMODEL).reduce((acc, [key, label]) => {
          acc[key] = game.i18n.localize('Liber.Vehicule.IA.'+label);
          return acc;
        }, {})
      }),
      modeleMoteur: new fields.StringField({
        required: true,
        initial: "M1", 
        choices: Object.entries(MOTEURMODEL).reduce((acc, [key, label]) => {
          acc[key] = game.i18n.localize('Liber.Vehicule.Moteur.'+label);
          return acc;
        }, {})
      }),
      modeleBlindage: new fields.StringField({
        required: true,
        initial: "M1", 
        choices: Object.entries(BLINDAGEMODEL).reduce((acc, [key, label]) => {
          acc[key] = game.i18n.localize('Liber.Vehicule.Blindage.'+label);
          return acc;
        }, {})
      }),
      tete: new foundry.data.fields.NumberField({ required: true, min: 0, max:10, initial: 0 }),
      armr: new foundry.data.fields.NumberField({ required: true, min: 0, max:10, initial: 0 }),
      arml: new foundry.data.fields.NumberField({ required: true, min: 0, max:10, initial: 0 }),
      legr: new foundry.data.fields.NumberField({ required: true, min: 0, max:10, initial: 0 }),
      legl: new foundry.data.fields.NumberField({ required: true, min: 0, max:10, initial: 0 }),
      body: new foundry.data.fields.NumberField({ required: true, min: 0, max:10, initial: 0 }),
      haut: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      droite: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      bas: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      gauche: new foundry.data.fields.NumberField({ required: true, min: 0, initial: 0 }),
      competences: new fields.SchemaField(
        Object.fromEntries(
          Object.keys(COMPETENCES).map(key => [
            key,
            new fields.NumberField({ required: true, min: -30, max: 50, initial: 0, label: COMPETENCES[key] })
          ])
        )
      )
    };
  }
  /** @override */
  //static LOCALIZATION_PREFIXES = ["Liber.Character"];
}
