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

CONFIG.Actor.trackableAttributes = {
      character: { bar: ["hp", "shield"], value: ["niveau", "armure"] },
      pnj:       { bar: ["hp", "shield"], value: ["niveau", "armure"] },
      monstre:   { bar: ["hp", "shield"], value: ["niveau", "armure"] }
  };


// Acteurs
foundry.documents.collections.Actors.unregisterSheet("core", ActorSheetV2);
foundry.documents.collections.Actors.registerSheet("liber", LiberCharacterSheet, { types: ["character","pnj"], makeDefault: true });
foundry.documents.collections.Actors.registerSheet("liber", LiberMonsterSheet, { types: ["monstre"], makeDefault: true });
foundry.documents.collections.Actors.registerSheet("liber", LiberVehiculeSheet, { types: ["vehicule"], makeDefault: true });

// Items
foundry.documents.collections.Items.unregisterSheet("core", ItemSheetV2);
foundry.documents.collections.Items.registerSheet("liber", LiberItemSheet, { types: ["item"], makeDefault: true });
foundry.documents.collections.Items.registerSheet("liber", LiberArmorSheet, { types: ["armor"], makeDefault: true });
foundry.documents.collections.Items.registerSheet("liber", LiberShieldSheet, { types: ["shield"], makeDefault: true });
foundry.documents.collections.Items.registerSheet("liber", LiberWeaponSheet, { types: ["weapon"], makeDefault: true });
foundry.documents.collections.Items.registerSheet("liber", LiberCompetenceSheet, { types: ["competence"], makeDefault: true });
foundry.documents.collections.Items.registerSheet("liber", LiberWeaponSheet, { types: ["weaponvehicule"], makeDefault: true });
foundry.documents.collections.Items.registerSheet("liber", LiberRoomSheet, { types: ["room"], makeDefault: true });

  
});

Handlebars.registerHelper('stripHTML', function(text) {
    return text.replace(/(<([^>]+)>)/gi, "");
});

// ----------------------------------------------------------------
// Token — déplacement durant le turn order
// ----------------------------------------------------------------
if (!game.liberMovement) game.liberMovement = {};

Hooks.on("updateCombat", (combat, changed) => {
  if (!("turn" in changed) && !("round" in changed)) return;
  game.liberMovement = {};
});

Hooks.on("preUpdateToken", (tokenDoc, changes) => {
  if (!game.combat?.started) return;
  if (!tokenDoc.isOwner) return;

  if (changes.x === undefined && changes.y === undefined) return;

  const id = tokenDoc.id;

  const DISTANCE_MAX = tokenDoc.occludable.radius ?? 8;

  const gridSize = canvas.grid.size;
  const gridDistance = canvas.scene.grid.distance ?? 1;

  const dx = (changes.x ?? tokenDoc.x) - tokenDoc.x;
  const dy = (changes.y ?? tokenDoc.y) - tokenDoc.y;

  const pixels = Math.sqrt(dx * dx + dy * dy);
  const meters = (pixels / gridSize) * gridDistance;

  if (!game.liberMovement[id]) {
    game.liberMovement[id] = { moved: 0, sprinting: false, warned: false };
  }

  const state = game.liberMovement[id];
  const total = state.moved + meters;

  const walk = DISTANCE_MAX;
  const sprint = DISTANCE_MAX * 2;

  // 🔴 limite absolue
  if (total > sprint) {
    ui.notifications.error("⛔ Max "+sprint+" !");
    return false;
  }

  // 🟠 dépassement marche → blocage + warning
  if (total > walk && !state.sprinting) {
    if (!state.warned) {
      ui.notifications.warn("⚠️ Sprint nécessaire ! Refaite le déplacement pour confirmer.");
      state.warned = true;
    } else {
      state.sprinting = true;
      ui.notifications.info("🏃 Sprint activé !");
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ token: tokenDoc }),
        content: `<strong>🏃 Sprint !</strong> <em>${tokenDoc.name}</em> dépasse sa marche normale et se met à sprinter.`,
        type: CONST.CHAT_MESSAGE_TYPES?.OOC ?? 1,
      });
    }
    return false;
  }

  // ✅ autorisé
  state.moved = total;
});