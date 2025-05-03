export const METIERS = {
    MARCHAND: "Marchand",
    ARTISAN: "Artisan",
    COLON: "Colon",
    INTELLECTUEL: "Intellectuel",
    MALANDRIN: "Malandrin",
    PILOTE: "Pilote",
    MEDECIN: "Medecin",
    MILITAIRE: "Militaire",
    TECHNICIEN: "Technicien",
    COMBATTANT: "Combattant"
};
export const RACES = {
    HUMAIN: "Humain",
    ARTHURIEN: "Arthurien",
    DRAGON: "Dragon",
    MACHINE: "Machine",
    PLEIADIEN: "Pleiadien",
    YORIBIEN: "Yoribien",
    ELFEN: "Elfen",
    ORCANIEN: "Orcanien"
};
export const FACTIONS = {
    EMPIRE: "Empire",
    OMC: "OMC",
    FEDERATION: "Federation",
    PLEIADE: "Pleiade",
    FANATIQUE: "Fanatique",
    REBEL: "Rebel",
    AUTRE: "Autre"
};
export const SEX = {
    MALE: "Male",
    FEMALE: "Female",
    AUTRE: "Autre"
};
export const CHOISE = {
    YES: "Yes",
    NO: "No"
};
export const COMPETENCES = Object.fromEntries(
    Object.keys({
        agilite: "", artisanat: "", balistique: "", combat: "", connaissance_general: "", connaissance_specifique: "", dexterite: "",
        diplomatie: "", discretion: "", force: "", investigation: "", reflection: "", mecanique: "", medecine: "", natation: "",
        navigation: "", negociation: "", perception: "", pilotage: "", piratage: "", pistage: "", religion: "",
        science: "", survie: "", tir: "", visee: ""
    }).map(attr => [attr, `Liber.Character.Competences.${attr}`])
);
export const TECHNO ={
    TECHNO0:"☆ ☆ ☆ ☆ ☆",
    TECHNO1:"✬ ☆ ☆ ☆ ☆",
    TECHNO2:"★ ☆ ☆ ☆ ☆",
    TECHNO3:"★ ✬ ☆ ☆ ☆",
    TECHNO4:"★ ★ ☆ ☆ ☆",
    TECHNO5:"★ ★ ✬ ☆ ☆",
    TECHNO6:"★ ★ ★ ☆ ☆",
    TECHNO7:"★ ★ ★ ✬ ☆",
    TECHNO8:"★ ★ ★ ★ ☆",
    TECHNO9:"★ ★ ★ ★ ✬",
    TECHNO10:"★ ★ ★ ★ ★"
}
export const ENERGIE ={
    CINETIQUE:"Cinetique",
    ENERGIE:"Energie",
    LASER:"Laser",
    PLASMA:"Plasma",
    SON:"Son",
}
export const VETEMENT={
    ARMOR:"Armure",
    COMBI:"Combinaison",
    TENUE:"Tenue",
    CHAMP:"Champ",
    BOUCL:"Boucl"
}
export const ATTITUDE={
    TRESAMICAL:"Tresamical",
    AMICAL:"Amical",
    NEUTRE:"Neutre",
    AGRESSIF:"Agressif",
    TRESAGRESSIF:"Tresagressif"
}
export const TAILLE = {
    MINI:"mini",
    SMART:"petit",
    MIDDLE:"moyen",
    TALL:"grand",
    BIG:"geant"
};
export const TYPES = {
    TERRE:"Terre",
    AIR:"Air",
    MER:"Mer",
    SPACE:"Space"
};
export const TAILLEV = {
    LEGER:"Leger",
    MOYEN:"Moyen",
    LOURD:"Lourd",
    MERES:"Meres"
};

export const USAGE = {
    COMBAT:"Combat",
    EXPLOR:"Exploration",
    COMMER:"Commerce",
    INDUST:"Industriel"
};

export const IAMODEL = {
  M1: "Basique",
  M2: "Assistante",
  M3: "Autonome",
  M4: "Intelligente",
  M5: "Avancee",
  M6: "Strategique",
  M7: "Predictive",
  M8: "Sentient",
  M9: "Superieure",
  M10: "Quasiconsciente"
};

export const MOTEURMODEL = {
  M1: "Moteurdiesel",
  M2: "Moteuressence",
  M3: "Moteurelectrique",
  M4: "Moteurhybride",
  M5: "Moteurhelices",
  M6: "Moteurreaction",
  M7: "Moteurnucleaire",
  M8: "Moteurfusion",
  M9: "Propulsionfurtive",
  M10: "PropulsionWarp"
};

export const BLINDAGEMODEL = {
  M1: "Leger",
  M2: "Standard",
  M3: "Renforce",
  M4: "Militaire",
  M5: "Composite",
  M6: "Reactif",
  M7: "Nano",
  M8: "Adaptatif",
  M9: "Energetique",
  M10: "Ultrarenforce"
};