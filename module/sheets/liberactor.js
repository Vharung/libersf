/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class LiberActor extends Actor {
  
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
    const actorData = this;
    const data = actorData;
    const flags = actorData.flags;
    //preparation dépendant du type de personnage (
    if (actorData.type === game.i18n.localize("TYPES.Actor.personnage")) this._preparePJData(actorData.system);
  }



   /**
   * Prepare Character type specific data
   */
  _preparePJData(actorData) {
    const data = actorData;    
  }

  prepareBaseData() {
  }

  prepareDerivedData() {
  }


}

