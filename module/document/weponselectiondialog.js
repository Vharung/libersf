const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class WeaponSelectionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(weapons, TIRMODES, options = {}) {
    super(options);
    this.weapons = weapons;
    this.TIRMODES = TIRMODES;
    this._resolve = null;
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["libersf", "dialog", "weapon-selection"],
    tag: "form",
    position: { 
      width: 400, 
      height: "auto" 
    },
    window: {
      resizable: false,
      title: "Sélectionnez une arme",
      id: "weapon-selection-dialog",
      frame: true,
      icon: "fa-solid fa-gun"
    },
    actions: {
      confirm: WeaponSelectionDialog.prototype._onConfirm,
      cancel: WeaponSelectionDialog.prototype._onCancel
    }
  };

  /** @override */
  static PARTS = {
    form: {
      template: "systems/libersf/templates/chat/weapon-selection.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    context.weapons = this.weapons.map(w => ({
      id: w.id,
      name: w.name
    }));
    
    context.tirModes = Object.entries(this.TIRMODES).map(([key, label]) => ({
      value: key,
      label: label
    }));
    
    context.labels = {
      choixArme: game.i18n.localize("Liber.Roll.Choixarme"),
      choixTir: game.i18n.localize("Liber.Roll.Choixtir")
    };
    
    return context;
  }

  /** @override */
  async _preparePartContext(partId, context) {
    context = await super._preparePartContext(partId, context);
    return context;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);
    
    // Focus automatique sur le premier select
    const firstSelect = this.element.querySelector("#selected-weapon");
    if (firstSelect) firstSelect.focus();
  }

  /** Action : Confirmer (méthode d'instance) */
  async _onConfirm(event, target) {
    event.preventDefault();
    
    const form = this.element;
    const weaponId = form.querySelector("#selected-weapon")?.value;
    const selectedTir = form.querySelector("#selected-tir")?.value;

    this._resolve({ weaponId, selectedTir });
    
    await this.close();
  }

  /** Action : Annuler */
  static async _onCancel(event, target) {
    event.preventDefault();
    this._resolve(null);
    this.close();
  }

  /** @override - Gérer la fermeture sans choix */
  async close(options = {}) {
    // Si fermé sans avoir choisi, renvoyer null
    if (this._resolve) {
      this._resolve(null);
      this._resolve = null;
    }
    return super.close(options);
  }
}
