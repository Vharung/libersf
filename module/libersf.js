import { LiberActor } from"./sheets/liberactor.js";
import { LiberActorSheet } from "./sheets/liberactorsheet.js";
import { LiberItem } from "./sheets/liberitem.js";
import { LiberItemSheet } from "./sheets/liberitemsheet.js";


Hooks.once("init", async function() {
    console.log("Liber SF | Initialisation du système Liber Chronicles");
	CONFIG.Actor.documentClass = LiberActor;
    CONFIG.Item.documentClass = LiberItem;

    CONFIG.Combat.initiative = {
	    formula: "1d6",
	    decimals: 2
	};

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("liber", LiberItemSheet, { makeDefault: true });

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("liber", LiberActorSheet, { makeDefault: true });
});