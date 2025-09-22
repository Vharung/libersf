//import les différentes classes
import {liber} from "./data/config.js";
import LiberCharacterSheet from "./sheet/actor.js";
import LiberMonsterSheet from "./sheet/monstre.js";
import LiberVehiculeSheet from "./sheet/vehicule.js";
import LiberCharacterData from "./data/actor.js";
import LiberItemSheet from "./sheet/item.js";
import LiberArmorSheet from "./sheet/armor.js";
import LiberShieldSheet from "./sheet/shield.js";
import LiberWeaponSheet from "./sheet/weapon.js";
import LiberCompetenceSheet from "./sheet/competence.js";
import LiberRoomSheet from "./sheet/room.js";
import LiberItemData from "./data/item.js";

const ActorSheetV2 = foundry.applications.sheets.ActorSheetV2;
const ItemSheetV2 = foundry.applications.sheets.ItemSheetV2;

/** Initialisation du système */
Hooks.once("init", async function () {
  console.log("Initialisation du système Liber...");
  console.log(liber.ASCII)

  CONFIG.Combat.initiative = {
    formula: "@competences.perception + @competences.investigation  + 1d20",
    decimals: 3
  };

  CONFIG.Actor.dataModels = {
    character: LiberCharacterData,
    pnj: LiberCharacterData,
    monstre: LiberCharacterData,
    vehicule: LiberCharacterData
  };

  
  CONFIG.Item.dataModels = {
    item: LiberItemData,
    armor: LiberItemData,
    shield: LiberItemData,
    weapon: LiberItemData,
    competence: LiberItemData,
    weaponvehicule: LiberItemData,
    room: LiberItemData
  };

  Actors.unregisterSheet("core", ActorSheetV2);
  Actors.registerSheet("liber", LiberCharacterSheet, { types: ["character","pnj"], makeDefault: true });
  Actors.registerSheet("liber", LiberMonsterSheet, { types: ["monstre"], makeDefault: true });
  Actors.registerSheet("liber", LiberVehiculeSheet, { types: ["vehicule"], makeDefault: true });
  Items.unregisterSheet("core", ItemSheetV2);
  Items.registerSheet("liber", LiberItemSheet, { types: ["item"], makeDefault: true });
  Items.registerSheet("liber", LiberArmorSheet, { types: ["armor"], makeDefault: true });
  Items.registerSheet("liber", LiberShieldSheet, { types: ["shield"], makeDefault: true });
  Items.registerSheet("liber", LiberWeaponSheet, { types: ["weapon"], makeDefault: true });
  Items.registerSheet("liber", LiberCompetenceSheet, { types: ["competence"], makeDefault: true });
  Items.registerSheet("liber", LiberWeaponSheet, { types: ["weaponvehicule"], makeDefault: true });
  Items.registerSheet("liber", LiberRoomSheet, { types: ["room"], makeDefault: true });
  
});

Handlebars.registerHelper('stripHTML', function(text) {
    return text.replace(/(<([^>]+)>)/gi, "");
});