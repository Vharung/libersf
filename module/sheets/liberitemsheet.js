/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Item}
 */
 export class LiberItemSheet extends ItemSheet{
    get template(){
        console.log(`Liber | Récupération du fichier html ${this.item.type}-sheet.`);

        return `systems/libersf/templates/sheets/${this.item.type}-sheet.html`;
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