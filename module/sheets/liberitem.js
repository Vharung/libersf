/**
 * Extend the base item document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Item}

 */
export class LiberItem extends Item {
  static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
          classes: ["Liber", "sheet", "item"],
          //template: "systems/boilerplate/templates/actor/actor-sheet.html",
          width: 600,
          height: 400,
        });
    }
	/** @override */
  prepareData() {
    // Prepare data for the item. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
    const itemData = this.data;
    const data = itemData.data;
    const flags = itemData.flags;
  	//preparation dépendant du type de personnage (
  	if (itemData.type === 'arme') this._prepareItemData(itemData);
    if (itemData.type === 'armure') this._prepareItemData(itemData);
    if (itemData.type === 'bouclier') this._prepareItemData(itemData);
    if (itemData.type === 'objet') this._prepareItemData(itemData);
    if (itemData.type === 'piece') this._prepareItemData(itemData);
  }


   /**
   * Prepare Character type specific data
   */
  _prepareItemData(itemData) {
    const data = itemData.data;
    //console.log(`Liber | Préparation Data Item.\n`);
    //console.log(data);
    // ici on peut ajouter au modele de donnée des stat dérivé comme par exemple le calcul des points de mana
    //itemData.data.allure=itemData.data.physique.agilite.dé;
    // Calcul souffle Max
    //itemData.data.souffleMax=itemData.data.physique.vigueur.dé + itemData.data.mental.ame.dé;

    // Loop through ability scores, and add their modifiers to our sheet output.
    //for (let [key, ability] of Object.entries(data.abilities)) {
      // Calculate the modifier using d20 rules.
    //  ability.mod = Math.floor((ability.value - 10) / 2);
    //}
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the basic item data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an item
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    //const itemData = this.data;
    //const data = itemData.data;
    //const flags = itemData.flags.boilerplate || {};

    // Make separate methods for each item type (character, npc, etc.) to keep
    // things organized.
    //this._prepareCharacterData(itemData);
    //this._prepareNpcData(itemData);
  }
}