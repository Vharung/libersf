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
    const actorData = this.system;
    const data = actorData;
    const flags = actorData.flags;
    //preparation dépendant du type de personnage (
    if (actorData.type === 'personnage') this._preparePJData(actorData);
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

  /*static async loadCompendiumData(compendium) {
    const pack = game.packs.get(compendium)
    return await pack?.getDocuments() ?? []
  }

  static async loadCompendium(compendium, filter = item => true) {
    let compendiumData = await CrucibleUtility.loadCompendiumData(compendium)
    return compendiumData.filter(filter)
  }*/
}

