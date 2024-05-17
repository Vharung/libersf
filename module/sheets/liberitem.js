/**
 * Extend the base item document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Item}

 */
export class LiberItem extends Item {
  static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
          classes: ["Liber", "sheet", "item"],
          width: 600,
          height: 400,
        });
    }
  prepareData() {
    super.prepareData();
    const itemData = this.system;
    const data = itemData.system;
    const flags = itemData.flags;
    //preparation dépendant du type de personnage (
    if (itemData.type === 'arme') this._prepareItemData(itemData);
    if (itemData.type === 'arme-véhicule') this._prepareItemData(itemData);
    if (itemData.type === 'armure') this._prepareItemData(itemData);
    if (itemData.type === 'bouclier') this._prepareItemData(itemData);
    if (itemData.type === 'objet') this._prepareItemData(itemData);
    if (itemData.type === 'piece') this._prepareItemData(itemData);
    if (itemData.type === 'level') this._prepareItemData(itemData);
  }

  _prepareItemData(itemData) {
    const data = itemData.system;
  }

  prepareBaseData() {
  }

  prepareDerivedData() {
  }

  MunMoins(){
    let itemData = this.system;
    let qty=itemData.quantite;
    qty--;
    this.update({'system.quantite':qty});
  }
  NunsMoins(){
    let itemData = this.system;
    let qty=itemData.quantite;
    qty=qty-10;
    this.update({'system.quantite':qty});
  }
  DegatArm(hp,hpmax){
    console.log('DegatArm'+hp)
    let itemData = this.system;
    this.update({'system.resitance':hp,'system.hp.max':hpmax});
  }
}