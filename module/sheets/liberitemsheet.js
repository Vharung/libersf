/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Item}
 */
 export class LiberItemSheet extends ItemSheet{
    get template(){
        if (this.item.type == game.i18n.localize("TYPES.Item.arme")  || this.item.type == game.i18n.localize("TYPES.Item.arme-véhicule")) {
            return `systems/libersf/templates/sheets/arme-sheet.hbs`;
        }else {//bug
            return `systems/libersf/templates/sheets/${this.item.type}-sheet.hbs`;
        }    
    }

    getData(){
        const data = super.getData();
        data.dtypes = ["String", "Number", "Boolean"];
        console.log(data);
        return data;
    }
    activateListeners(html){
        super.activateListeners(html);
        /*Ancienté*/
        html.find('.ancienete').on('click',function(){
            var texte=$(this).html();
            html.find('.model').val(texte);
        });
    }
}