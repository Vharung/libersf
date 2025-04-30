const ItemSheetV2 = foundry.applications.sheets.ItemSheetV2;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/** Gestion de la feuille d'objet */
export default class LiberItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["liber", "item"],
    position: { width: 500, height: 550 },
    form: { submitOnChange: true },
    window: { resizable: true }
  };

  /** @override */
  static PARTS = {
    header: { template: "systems/libersf/templates/item/item-header.hbs" },
    main:{template: "systems/libersf/templates/item/item-main-armor.hbs"}
  };

  _onRender(context, options) {
    console.log("Context rendu :", context);
  }


  /** Préparation des données */
  async _prepareContext() {
      console.log("Préparation du contexte de l'objet :", this);
      console.log(this.item.type)

      const context = {
        fields: this.document.schema.fields, // ✅ Assure que les champs sont bien accessibles
        systemFields: this.document.system.schema.fields, // ✅ Ajoute les champs système
        source: this.document.toObject(), // ✅ Ajoute `source.name` correctement
        item: this.document,
        system: this.document.system
      };

    return context;
  }


  _prepareItemData(itemData) {
    const data = itemData.system;
    console.log(data)
  }

}