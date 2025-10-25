const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class TechLevelDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(resolve, options = {}) {
    super(options);
    this._resolve = resolve;
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["libersf", "dialog", "tech-level"],
    tag: "form",
    position: { 
      width: 350, 
      height: "auto" 
    },
    window: {
      resizable: false,
      title: "Niveau de technologie",
      id: "tech-level-dialog",
      frame: true,
      icon: "fa-solid fa-microchip"
    },
    actions: {
      confirm: TechLevelDialog._onConfirm,
      cancel: TechLevelDialog._onCancel
    }
  };

  /** @override */
  static PARTS = {
    form: {
      template: "systems/libersf/templates/chat/tech-level.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    context.techLevels = [
      { value: 0, label: "☆ ☆ ☆ ☆ ☆" },
      { value: 1, label: "✬ ☆ ☆ ☆ ☆" },
      { value: 2, label: "★ ☆ ☆ ☆ ☆" },
      { value: 3, label: "★ ✬ ☆ ☆ ☆" },
      { value: 4, label: "★ ★ ☆ ☆ ☆" },
      { value: 5, label: "★ ★ ✬ ☆ ☆" },
      { value: 6, label: "★ ★ ★ ☆ ☆" },
      { value: 7, label: "★ ★ ★ ✬ ☆" },
      { value: 8, label: "★ ★ ★ ★ ☆" },
      { value: 9, label: "★ ★ ★ ★ ✬" },
      { value: 10, label: "★ ★ ★ ★ ★" }
    ];
    
    context.techLabel = game.i18n.localize("Liber.Items.Techno");
    
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
    
    // Focus automatique sur le select
    const select = this.element.querySelector("#tech-level");
    if (select) select.focus();
  }

  /** Action : Confirmer */
  static async _onConfirm(event, target) {
    event.preventDefault();
    
    const form = this.element;
    const select = form.querySelector("#tech-level");
    const level = select ? parseInt(select.value) : null;
    
    this._resolve(level);
    this.close();
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