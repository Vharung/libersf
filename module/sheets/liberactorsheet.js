/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
 export class LiberActorSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
          classes: ["Liber", "sheet", "actor"],
          //template: "systems/liber/templates/actor/personnage-sheet.html",
          width: 1115,
          height: 740,
          tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    get template() {
        if (this.actor.type == 'personnage' || this.actor.type == 'pnj' ) {
            return `systems/libersf/templates/sheets/personnage-sheet.html`;
        }else {
            return `systems/libersf/templates/sheets/${this.actor.type}-sheet.html`;
        }
        console.log(`Liber | Récupération du fichier html ${this.actor.type}-sheet.`);
        
    }

    getData(){
        const data = super.getData();
        var poidsactor='';
        data.dtypes = ["String", "Number", "Boolean"];
        console.log(data);        
        if (this.actor.type == 'personnage' || this.actor.type == 'pnj' || this.actor.type == 'monstre' | this.actor.type == 'vehicule') {
            this._prepareCharacterItems(data);this._onStatM(data);
        }
        if (this.actor.type == 'personnage' || this.actor.type == 'pnj' ) {
            this._onEncom(data);
        }
        return data;
    }

   
    _prepareCharacterItems(sheetData) {
       const actorData = sheetData.actor;

        // Initialize containers.
        const inventaire = [];
        const arme = [];
        const armure = [];
        const piece = [];
        const argent = [];
        const sort = [];
        
        // Iterate through items, allocating to containers
        // let totalWeight = 0;
        for (let i of sheetData.items) {
          let item = i.items;
          i.img = i.img || DEFAULT_TOKEN;
          if (i.type === 'arme') {
            arme.push(i);
          }
          else if (i.type === 'armure') {
            armure.push(i);
          }
          else if (i.type === 'bouclier') {
            armure.push(i);
          }
          else if (i.type === 'objet') {
            inventaire.push(i);
          }
          else if (i.type === 'piece') {
            piece.push(i);
          }
          else if (i.type === 'argent') {
            argent.push(i);
          }
          else if (i.type === 'sort') {
            sort.push(i);
          }
        }
        sort.sort((a, b) => a.system.cout - b.system.cout);
        inventaire.sort(function (a, b) {if (a.name < b.name) {return -1;} else {return 1;}});
        arme.sort(function (a, b) {if (a.name < b.name) {return -1;} else {return 1;}});
        piece.sort(function (a, b) {if (a.name < b.name) {return -1;} else {return 1;}});
        armure.sort(function (a, b) {if (a.name < b.name) {return -1;} else {return 1;}});
        // Assign and return
        actorData.inventaire = inventaire;
        actorData.arme = arme;
        actorData.piece = piece;
        actorData.armure = armure;
        actorData.argent = argent;
        actorData.sort = sort;
    }


    activateListeners(html){
        super.activateListeners(html);

        /*Jet de des*/
        html.find('.jetdedes').click(this._onRoll.bind(this)); 

        html.find('.item-equip').click(this._onArmor.bind(this));
        html.find('.desequi').click(this._onDesArmor.bind(this));
        html.find('.update').click(this._onNivArmor.bind(this))
        //choix Race
        html.find('.racechoix').click(this._onAvantageRace.bind(this));
        html.find('.metierchoix').click(this._onAvantageJob.bind(this));
        //caractere aléatoire
        html.find('.genererp').click(this._onEarth.bind(this));
        html.find('.generator').click(this._onStory2.bind(this));
        html.find('.caractergen').click(this._onStory.bind(this));
        html.find('.aleatoire').click(this._onAleatoire.bind(this));
        /*Etat*/
        html.find('.action6').click(this._onCouv.bind(this));
        html.find('.chnget').click(this._onCouv.bind(this));
        html.find('.vehichoix').click(this._onVehi.bind(this))
        /*edition items*/
        html.find('.item-edit').click(this._onItemEdit.bind(this));


        let niva=html.find('.cpt2').val();
        let armetoile='';
        let rac=html.find('.raceliste').val();
        if(rac=="Elfen"){niva=parseInt(niva)+10}
        if(niva<0){armetoile='✬ ☆ ☆ ☆ ☆'}
        else if(niva<5){armetoile='★ ☆ ☆ ☆ ☆'}
        else if(niva<10){armetoile='★ ✬ ☆ ☆ ☆'}
        else if(niva<15){armetoile='★ ★ ☆ ☆ ☆'}
        else if(niva<20){armetoile='★ ★ ✬ ☆ ☆'}
        else if(niva<25){armetoile='★ ★ ★ ☆ ☆'}
        else if(niva<30){armetoile='★ ★ ★ ✬ ☆'}
        else if(niva<35){armetoile='★ ★ ★ ★ ☆'}
        else if(niva<40){armetoile='★ ★ ★ ★ ✬'}
        else {armetoile='★ ★ ★ ★ ★'}
    console.log(armetoile)
        html.find('.armetoile').html('(max '+armetoile+' )')

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            let d = Dialog.confirm({
                title: game.i18n.localize("liber.suppr"),
                content: "<p>"+game.i18n.localize("liber.conf")+ item.name + "'.</p>",
                yes: () => item.delete(),
                no: () => { },
                defaultYes: false
            });
            //item.delete();
            li.slideUp(200, () => this.render(false));
        });



        html.find('.item-create').click(ev => {
            event.preventDefault();
            const dataType=$(ev.currentTarget).data('type');
            const name = `New ${dataType.capitalize()}`;
            this.actor.createEmbeddedDocuments('Item', [{ name: name, type: dataType }], { renderSheet: true })
        });

        html.find('.item-desc').on('click',function(){
           var hauteur= $(this).parent().parent().css("height");
           if(hauteur=='30px'){
                $(this).parent().parent().css({"height":"auto"});
            }else{
                $(this).parent().parent().css({"height":"30px"});
            }
        });

        //choix faction
        html.find('.factionchoix').on('click',function(){ 
            var clanliste=html.find('.factionliste').val();
            html.find('.faction').val(clanliste);
        });

        


        //calcul point restant
        if(this.actor.type=="vehicule"){
            var type=this.actor.system.type;
            var tail=this.actor.system.taille;
            var ptfixe=this.actor.system.pointrestant2;
            if(type==1){
                html.find('.types').val(game.i18n.localize("libersf.type1"));
            }else if(type==2){
                html.find('.types').val(game.i18n.localize("libersf.type2"));
            }else if(type==3){ 
                html.find('.types').val(game.i18n.localize("libersf.type3"));
            }else if(type==4){
                html.find('.types').val(game.i18n.localize("libersf.type4"));
            }
            if(tail==1){
                html.find('.tailles').val(game.i18n.localize("libersf.taille1"));
            }else if(tail==2){
                html.find('.tailles').val(game.i18n.localize("libersf.taille2"));
            }else if(tail==3){
                html.find('.tailles').val(game.i18n.localize("libersf.taille3"));
            }else if(tail==4){
                html.find('.tailles').val(game.i18n.localize("libersf.taille4"));
            }

            var prix=[];
            var quantite=[];
            var total=this.actor.system.prixbase;
            //var exo=html.find('.armurequi').val()
            html.find( ".item-valeur" ).each(function( index ) {
                if($( this ).text()!=game.i18n.localize('libersf.l4')){
                    prix.push($( this ).text());
                }
                
            });
            //console.log(prix)
            html.find( ".item-qt" ).each(function( index ) {
                if($( this ).text()!=game.i18n.localize('libersf.l6')){
                    quantite.push($( this ).text());
                }
            });
            //console.log(quantite)

            for (var i = 1;i < prix.length ; i++) {
               total=total+parseFloat(prix[i])*parseFloat(quantite[i]);
            }
            console.log(total)
            this.actor.update({'system.prix': total});
        }

            var clanliste=html.find('.raceliste').val();
            var metierliste=html.find('.metierliste').val();
            var metier=html.find('.metier').val();
            var race=html.find('.race').val();
            var ptrestant=html.find('.pointrestant').val();
            var level=html.find('.niveau').val();
            if(this.actor.type=="vehicule"){
                var ptrestant2=this.actor.system.pointrestant2;
                var resultat=parseInt(ptrestant2);
            }else {
                var resultat=-20-((parseInt(level)-1)*10); 
            }
            for(i=0;i<26;i++){
                var valor=parseInt(html.find('.cpt'+i).val());
                resultat=resultat+valor;
            }
            $( ".features input" ).each(function( index ) {
              var valor= $( this ).val();
              if(valor==0){
                $( this ).css({"background":"transparent","color": "#fff"});
              }else if(valor>0){
                $( this ).css({"background":"#56853b","color": "white"});
              }else if(valor<0){
                $( this ).css({"background":"#a51b1b","color": "white"});
              }
            });
            if(level==undefined){
                resultat=resultat;
            }else {
                var hpmax=html.find('.hpmax').val();
                var pointhp=(parseInt(hpmax)-20)*2;
                resultat=resultat+pointhp; 
            }
            console.log(resultat)
            html.find('.pointrestant').val(resultat); 


        

        



        /*Avantage*/
        var avant=html.find('.avant').val();
        var desan=html.find('.desan').val();
        var solit=html.find('.solit').val();
        if(avant>0){
            html.find('.avant').css("opacity", "1");
        }else {
            html.find('.avant').css("opacity", "0.5");
        }
        if(desan>0){
            html.find('.desan').css("opacity", "1");
        }else {
            html.find('.desan').css("opacity", "0.5");
        }
        if(solit>0){
            html.find('.solit').css("opacity", "1");
        }else {
            html.find('.solit').css("opacity", "0.5");
        }

        

        /*Ancienté*/
        var ancien=html.find('.model').val();
        var etoile="☆ ☆ ☆ ☆ ☆"
        if(ancien=="Antiquité : ✬ ☆ ☆ ☆ ☆"){etoile="✬ ☆ ☆ ☆ ☆"}
        else if(ancien=="Obsolette : ★ ☆ ☆ ☆ ☆"){etoile="★ ☆ ☆ ☆ ☆"}
        else if(ancien=="Dépasser : ★ ✬ ☆ ☆ ☆"){etoile="★ ✬ ☆ ☆ ☆"}
        else if(ancien=="Ancien  : ★ ★ ☆ ☆ ☆"){etoile="★ ★ ☆ ☆ ☆"}
        else if(ancien=="Standard  : ★ ★ ✬ ☆ ☆"){etoile="★ ★ ✬ ☆ ☆"}
        else if(ancien=="Récent  : ★ ★ ★ ☆ ☆"){etoile="★ ★ ★ ☆ ☆"}
        else if(ancien=="Moderne : ★ ★ ★ ✬ ☆"){etoile="★ ★ ★ ✬ ☆"}
        else if(ancien=="Avant-gardiste  : ★ ★ ★ ★ ☆"){etoile="★ ★ ★ ★ ☆"}
        else if(ancien=="Futuriste : ★ ★ ★ ★ ✬"){etoile="★ ★ ★ ★ ✬"}
        else if(ancien=="Prototype : ★ ★ ★ ★ ★"){etoile="★ ★ ★ ★ ★"}
        html.find('.etoile').html(etoile);


        ;


        //+1 action si dext et agilité >30
        var agi=html.find('.cpt0').val();
        var dex=html.find('.cpt6').val();
        if(agi >=30 && dex >=30){
            html.find('.titreaction').html(game.i18n.localize("libersf.action2"))
        }

        //couleur bar
        html.find( ".refbar" ).each(function( index ) {
          var pc=$( this ).val();
          var name=$( this ).attr('data-zone');
          var z=0;var t='';
          if(name=="tete"){
            z=1;t='t';
          } else if(name=="torse"){
            z=2;t='to';
          } else if(name=="bd"){
            z=3;t='tbd';
          } else if(name=="bg"){
            z=4;t='tbg';
          } else if(name=="jd"){
            z=5;t='tjd';
          } else if(name=="jg"){
            z=6;t='tjg';
          }
          pc=(10-parseInt(pc))*10;
          if(pc>'60'){
            $('.zone.'+name+' .bar').css({'background':'#00abab','width':pc+'%'});
            $('.z'+z).css({'background':' url(systems/libersf/assets/icon/'+t+'1.png) center center no-repeat'});
          }else if(pc>'30'){
            $('.zone.'+name+' .bar').css({'background':'#c9984b','width':pc+'%'});
            $('.z'+z).css({'background':' url(systems/libersf/assets/icon/'+t+'2.png) center center no-repeat'});
          }else if(pc<=0){
            $('.zone.'+name+' .bar').css({'background':'#460000','width':pc+'%'});
            $('.z'+z).css({'background':' url(systems/libersf/assets/icon/'+t+'0.png) center center no-repeat'});
          }else{
            $('.zone.'+name+' .bar').css({'background':'#a10001','width':pc+'%'});
            $('.z'+z).css({'background':' url(systems/libersf/assets/icon/'+t+'3.png) center center no-repeat'});
          }
        });

        /*Poids encombrement*/
        var poids=[];
        var quantite=[];
        var total=0;
        //var exo=html.find('.armurequi').val()
        html.find( ".item-poid" ).each(function( index ) {
          poids.push($( this ).text());
        });
        html.find( ".item-qt" ).each(function( index ) {
          quantite.push($( this ).text());
        });


        for (var i = 1;i < poids.length ; i++) {
           total=total+parseFloat(poids[i])*parseFloat(quantite[i]);
        }
        /*if(exo=="Exosquelette"){
            enc=enc*2;
        }*/
        var enc=html.find('.enc').val();
        var enc=parseFloat(enc);
        var pourcentage= total*100/enc;

        if(pourcentage<50){
            html.find('.barenc').css({"background":'#00abab'})
        }else if(pourcentage<75){
            html.find('.barenc').css({"background":'#c9984b'})
        }else if(pourcentage<100){
            html.find('.barenc').css({"background":'#a10001'})
        }else if(pourcentage<120){
            html.find('.barenc').css({"background":'#660000'})
        }else{
            html.find('.barenc').css({"background":'#460000'})
        }
        if(pourcentage>100){
            pourcentage=100;
        }
        html.find('.encours').val(total);
        html.find('.barenc').css({"width":pourcentage+"%"});

        

        /*Ajout Bonus*/
        $('.attribut').on('click',function(){
            var bonusactor=$(this).attr('name');
            html.find(".bonusactor").val(bonusactor);            
        });

        /*Reset Bonus*/
        $('.resetbonus').on('click',function(){
            html.find(".bonusactor").val('0');            
        });

         

        //vh_blind
        var blind=html.find(".vh_blind").val();
        var blindage=html.find(".blindagemax").val();
        var pourcent=parseInt(blind)*100/parseInt(blindage);
        html.find(".blinder .bar").css({'width':pourcent+'%'});
        var andro=html.find('.andomedes').val();
        if(andro=='oui'){
            html.find(".andromede").css({'display':'block'});
        }else{
            html.find(".andromede").css({'display':'none'});
        }
        html.find(".blindage").val(blind);
        var maxblind=0;
        var actboumax=html.find(".actboumax").val();
        for (var i=0; i<5; i++) {
            var min=html.find(".min"+i).val();
            var max=html.find(".max"+i).val();
            if(i<4){maxblind=parseInt(maxblind)+parseInt(max)};
            var pou=parseInt(min)*100/parseInt(max);
            //console.log(pou)
            if(pou<20){
                var color='red';
            }else if(pou<60){
                var color='orange';
            }else if(i==4){
                var color='green';
            }else{
                var color='blue';
            }
            html.find(".bar"+i).css({'width':pou+'%','background':color});
        }

            if(maxblind<actboumax){
                var diff=actboumax - maxblind
                html.find('.ptrestbar').html("il reste :"+diff+" d'énergie à utiliser")
            }else if(maxblind>actboumax){
                var diff=maxblind -actboumax 
                html.find('.ptrestbar').html(diff+" d'énergie est en trop")
            }else{
                html.find('.ptrestbar').html("Tous les points d'armure sont répartis sur les zones.")
            }

        html.find( ".compt input" ).each(function() {
              var valor= $( this ).val();
              if(valor==0){
                $( this ).css({"background":"transparent","color": "#fff"});
              }else if(valor>0){
                $( this ).css({"background":"#00abab","color": "white"});
              }else if(valor<0){
                $( this ).css({"background":"#a10001","color": "white"});
              }
            });
        var hp= html.find('.hp').val();
        var mut= html.find('.mutation').val();
        
        if(hp<=0){
            html.find('.outer').css({"background": "linear-gradient(-45deg, transparent 12px, #ff0101 0) right,linear-gradient(135deg, transparent 12px, #ff0101 0) left","background-size":"50% 100%","background-repeat": "no-repeat"});
            html.find('.inner').css({"background": "linear-gradient(-45deg, transparent 12px, #310101 0) right,linear-gradient(135deg, transparent 12px, #310101 0) left","background-size":"50% 100%","background-repeat": "no-repeat"});
            html.find('.santes').css({"background": "none"});
        }else if(mut=="oui"){
            html.find('.outer').css({"background": "linear-gradient(-45deg, transparent 12px, #3ce47b 0) right,linear-gradient(135deg, transparent 12px, #3ce47b 0) left","background-size":"50% 100%","background-repeat": "no-repeat"});
            html.find('.inner').css({"background": "linear-gradient(-45deg, transparent 12px, #00220f  0) right,linear-gradient(135deg, transparent 12px, #00220f 0) left","background-size":"50% 100%","background-repeat": "no-repeat"});
            html.find('.santes').css({"background": "url(systems/libersf/css/biohazard.jpg) center center","background-size":"80% 80%","background-repeat": "no-repeat"});
        }else {
            html.find('.outer').css({"background": "linear-gradient(-45deg, transparent 12px, #00FFFF 0) right,linear-gradient(135deg, transparent 12px, #00FFFF 0) left","background-size":"50% 100%","background-repeat": "no-repeat"});
            html.find('.inner').css({"background": "linear-gradient(-45deg, transparent 12px, #004060  0) right,linear-gradient(135deg, transparent 12px, #004060 0) left","background-size":"50% 100%","background-repeat": "no-repeat"});
            html.find('.santes').css({"background": "none"});
        } 


    }


    getItemFromEvent = (ev) => {
        const parent = $(ev.currentTarget).parents(".item");
        return this.actor.items.get(parent.data("itemId"));
    }

    _onItemEdit(event){
        const item = this.getItemFromEvent(event);
        item.sheet.render(true);
    }

    _onRoll(event){
        let maxstat = event.target.dataset["attdice"];
        var name = event.target.dataset["name"];
        var type = this.actor.system.typed;
        var arme = this.actor.system.armed;
        var chargequi = this.actor.system.charged;
        var degat = this.actor.system.degatd;
        var etoiled = this.actor.system.etoiled;

        var balistique=this.actor.system.Balistique;

        const jetdeDesFormule = "1d100";
        var bonus =this.actor.system.malus;
        var critique=5;
        if(type=="C"){
            critique=10;
        }
        var echec=95;
        if(type=="P"){
            echec=90;
        }
        
        var conf="auto";
        if(bonus=='' || bonus ==undefined || bonus==null){
            bonus=0;
        }
        let inforesult=parseInt(maxstat)+parseInt(bonus)+30;
        if(inforesult>echec){
            inforesult=echec;
        }
        let etoilemax = Math.floor(parseInt(balistique)/5);
        let etoile=0;
        if(etoiled=="★ ★ ★ ★ ★"){
            etoile=10;
        }else if(etoiled=="★ ★ ★ ★ ✬"){
            etoile=9;
        }else if(etoiled=="★ ★ ★ ★ ☆"){
            etoile=8;
        }else if(etoiled=="★ ★ ★ ✬ ☆"){
            etoile=7;
        }else if(etoiled=="★ ★ ★ ☆ ☆"){
            etoile=6;
        }else if(etoiled=="★ ★ ✬ ☆ ☆"){
            etoile=5;
        }else if(etoiled=="★ ★ ☆ ☆ ☆"){
            etoile=4;
        }else if(etoiled=="★ ✬ ☆ ☆ ☆"){
            etoile=3;
        }else if(etoiled=="★ ☆ ☆ ☆ ☆"){
            etoile=2;
        }else if(etoiled=="✬ ☆ ☆ ☆ ☆"){
            etoile=1;
        }
        let dif=parseInt(etoilemax)-parseInt(etoile);
        if(name=="Tir" || name=="Tircouv"){
            inforesult=parseInt(inforesult)+(dif*5)
            console.log(inforesult)
            if(name=="Tir"){var conf="none;width: 200px;";}
            if(chargequi=='' || chargequi== undefined){
                 chargequi="Mun. "+arme
            }
            var chargeur=this.actor.items.filter(i=>i.name == chargequi); 
                 
            
            if(chargeur.length === 0){
                succes="<h4 class='resultat' style='background:#ff3333;'>Pas de chargeur !</h4>";
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: succes
                  });
                return;
            }
            var munition=chargeur[0].system.quantite;
            if(munition<=0 || name=="Tircouv" && munition<=10 ){   
                succes="<h4 class='resultat' style='background:#ff3333;'>Plus de munition !</h4>";
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: succes
                  });
                return;
            } 
        }
        let r = new Roll("1d100");
        var roll=r.evaluate({"async": false});
        var deg='';
        var perte=0;
        let retour=r.result; var succes="";
        if(name=="Visée"){
            if(retour>echec){
                succes="<h4 class='resultat' style='background:#ff3333;'>Arme Inutilisable</h4>";
                deg='<h4 class="resultdeg3"></h4>';
            }else if(retour>(inforesult+20)){
                succes="<h4 class='resultat' style='background:#ff5733;'>L'arme est enrayé pour 1 tour</h4>";
                deg='<h4 class="resultdeg2"></h4>';
            }else if(retour>inforesult){
                succes="<h4 class='resultat' style='background:#ff5733;'>Raté</h4>";
                deg='<h4 class="resultdeg4"></h4>';
            }else if(retour>(inforesult-20)){
                succes="<h4 class='resultat' style='background:#78be50;'>La cible est touché</h4>";
                deg='<h4 class="resultdeg"></h4>';
            }else if(retour>critique){
                succes="<h4 class='resultat' style='background:#78be50;'>Dégât x1.5</h4>";
                deg='<h4 class="resultdeg"></h4>';
            }else if(retour<=critique){
                succes="<h4 class='resultat' style='background:#78be50;'>Dégât x2</h4>";
                deg='<h4 class="resultdeg"></h4>';
            }
        }else if(name=="Tircouv"){
            perte=10;
            if(retour>echec){
                succes="<h4 class='resultat' style='background:#ff3333;'>Action raté</h4>";
            }else if(retour>(inforesult+20)){
                succes="<h4 class='resultat' style='background:#ff5733;'>Malus de 15 aux ennemis</h4>";
            }else if(retour>inforesult){
                succes="<h4 class='resultat' style='background:#ff5733;'>Malus de 15 aux ennemis</h4>";
            }else if(retour>(inforesult-20)){
                succes="<h4 class='resultat' style='background:#78be50;'>Malus de 30 aux ennemis</h4>";              
            }else if(retour>critique){
                succes="<h4 class='resultat' style='background:#78be50;'>Malus de 30 aux ennemis</h4>";
            }else if(retour<=critique){
                succes="<h4 class='resultat' style='background:#78be50;'>Annule le prochain tour des ennmis</h4>";;                
            }  
        }else if(name=="Tir"){
            var bles=0;
            name+=" avec "+arme;       
            if(retour>95){
                succes="<h4 class='resultat' style='background:#ff3333;'>Arme Inutilisable</h4>";
                deg='<h4 class="resultdeg3"></h4>';
            }else if(retour>(inforesult+20)){
                succes="<h4 class='resultat' style='background:#ff5733;'>L'arme est enrayé pour 1 tour</h4>";
                deg='<h4 class="resultdeg2"></h4>';
            }else if(retour>inforesult){
                succes="<h4 class='resultat' style='background:#ff5733;'>Raté</h4>";
                deg='<h4 class="resultdeg4"></h4>';
                perte=1;
            }else if(retour>(inforesult-20)){
                succes="<h4 class='resultat' style='background:#78be50;'>La cible est touché</h4>";
                deg='<h4 class="resultdeg">'+degat+'</h4>';
                perte=1;bles=1;                
            }else if(retour>critique){
                succes="<h4 class='resultat' style='background:#78be50;'>Dégât x1.5</h4>";
                degat=Math.round(parseInt(degat)*1.5);
                deg='<h4 class="resultdeg">'+degat+'</h4>';
                perte=1;bles=1;
            }else if(retour<=critique){
                succes="<h4 class='resultat' style='background:#78be50;'>Dégât x2</h4>";
                degat=parseInt(degat)*2;
                deg='<h4 class="resultdeg">'+degat+'</h4>';
                perte=1;bles=1;               
            } 
            //degat auto
            if(bles==1){
                game.user.targets.forEach(i => {
                    var nom=i.document.name;
                    var hp = i.document._actor.system.stat.hp.value;
                    var armure=i.document.actor.system.stat.armure.value
                    var boucli=i.document.actor.system.stat.protections.value;
                    if(type=="L"){
                        boucli=parseInt(boucli)-parseInt(degat)
                        degat=parseInt(degat)-parseInt(armure)
                        if(armure<0){
                            armure=0;
                            hp=hp-parseInt(degat)
                            console.log(hp+'='+degat+'-'+boucli+'-'+armure)
                        }
                    }else if(type=="F" || type=="E"){
                        boucli=parseInt(boucli)-parseInt(degat)
                        degat=parseInt(degat)-parseInt(boucli)
                        if(boucli<0){
                            boucli=0;
                            hp=hp-parseInt(degat)
                            console.log(hp+'='+degat+'-'+boucli+'-'+armure)
                        } 
                    }else if(type=="P" || type=="S"){
                        hp=hp-parseInt(degat)
                    }else{
                        boucli=parseInt(boucli)-parseInt(degat)
                        degat=parseInt(degat)-parseInt(boucli)
                        if(boucli<0){
                            boucli=0;
                            degat=parseInt(degat)-parseInt(armure)
                            armure=parseInt(armure)-parseInt(degat)
                            if(armure<0){
                                armure=0;
                                hp=hp-parseInt(degat)
                                console.log(hp+'='+degat+'-'+boucli+'-'+armure)
                            }
                        }        
                    }
                    
                    //diminier les armures et boucliers en fonction type d'arme
                    // retirer HP
                    if(bles>0){
                        hp=parseInt(hp)-degat;
                        if(hp<0){
                            console.log(i)
                            hp=0; 
                            i.actor.createEmbeddedDocuments("ActiveEffect", [
                              {label: 'Mort', icon: 'icons/svg/skull.svg', flags: { core: { statusId: 'dead' } } }
                            ]);
                            console.log(i)

                        }
                        i.actor.update({'system.stat.hp.value': hp,'system.stat.armure.value': armure,'system.stat.protections.value': boucli });
                    } 
                })
            }
           
        }else {
            if(retour>echec){
                succes="<h4 class='resultat' style='background:#ff3333;'>Echec critique</h4>";
            }else if(retour<=critique){
                succes="<h4 class='resultat' style='background:#7dff33;'>Réussite critique</h4>";
            }else if(retour<=inforesult){
                succes="<h4 class='resultat' style='background:#78be50;'>Réussite</h4>";
            }else{
                succes="<h4 class='resultat' style='background:#ff5733;'>Echec</h4>";
            }
        }
        if(perte==1 || perte==10){
            console.log('perte'+perte)
            let itemData= this.actor.items.filter(i=>i.name == chargequi);                 
            var iditem= itemData[0].id;
            var qty = itemData[0].system.quantite;
            if(perte==10){
                itemData[0].NunsMoins();
            }else{
                itemData[0].MunMoins();
            }
        } 
        
    
        if(inforesult<=0){
            succes="<h4 class='resultat' style='background:#ff3333;'>Echec critique</h4>";
        }
        const texte = '<span style="flex:'+conf+'"><p style="text-align: center;font-size: medium;background: #00abab;padding: 5px;color: white;">Jet de ' + name + " : " + jetdeDesFormule +" - " + inforesult + '</p>'+ succes+'</span>'+deg;
        //roll.roll().toMessage({
        roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: texte
        });
    }


    _onStory(event){
        var demeure = ["Maison","Hotel","Chez un ami","demeure","Sous un pont","Sur un Bateau","Ferme","Auberge","Commerce / Négociation","Forge","Villa","Cabane"];
        var proximite=["sur une planète du secteur de","sur"];
        var lieu=["End-125","Proxima","Atarus","Sebos","ZX52","DX-128","ROF-89","HD-720P","Quenza","Sigma","TK86","Talouine","Turka","Rota","Imperator","Reset","Creab","87AB","TH5","R852","Natura","F10-X","Tella","Olympus","Iron","Zeus","Athena","Gaia","Apollon","Gallus","M-IP","Elysée","Grande nébuleuse","Tartare","Alexandrie","Maxima","74P-R","Centaurus","Nouvelle Terre","END-128","Terre","HAT-P1B","Valhala","Mystérious"]
        var resident = demeure[Math.floor(Math.random()*demeure.length)]+" "+proximite[Math.floor(Math.random()*proximite.length)]+" "+lieu[Math.floor(Math.random()*lieu.length)];
        this.actor.update({'system.caractere.residence': resident});
        var titre=["de contrebandier","de commercant","de militaire","de colon","d'aventuriers","de pilote","d'artisan","de médecin","de mécanicien","d'intellectuel"];
        var sang = "Issue d'une famille "+titre[Math.floor(Math.random()*titre.length)];
        this.actor.update({'system.caractere.sang': sang});  
        var rang=["Subordonné","Chef","Dirigeant","Membre","Adepte","Affilié","Cotisant","Participant","Soutien"]
        var organisation=["de l'empire","de la rébélion","de la pléide","de l'OMC","de la fédération","des fanatiques","du commité des pilotes","du commité des chasseurs","du comité des commerçants","du comité des voyageurs","du comité des philosophes","du comité des artistes","de la guilde des contrebandier","du comité des militaire","de la guilde des mercenaires","de la guilde des tueurs de monstres","de la bande de bandits","de la bande de pirates"]
        var politique=rang[Math.floor(Math.random()*rang.length)]+" "+organisation[Math.floor(Math.random()*organisation.length)];
        this.actor.update({'system.caractere.politique': politique});
        var groupe=organisation[Math.floor(Math.random()*organisation.length)]
        this.actor.update({'system.caractere.interets': groupe});
        var pertes=["mère","père","frère","soeur","ami(e)","amant(e)","personne","mentor","disciple","chef de son groupe","oncle","cousin","neveu","fiancé(e)","enfant","compagnon d'armes","rival(e)"]
        var dc=pertes[Math.floor(Math.random()*pertes.length)]
        this.actor.update({'system.caractere.deces': dc});
        var valeur=["Aucun","Ethique","Verteux","Stoïcisme","Social","Humaniste","Questionnement","Droit","Juste","Corrompu","Egoiste","Individualiste","Communautaire"]
        var moral=valeur[Math.floor(Math.random()*valeur.length)]
        this.actor.update({'system.caractere.moral': moral});
        var race=["Humain","Alpha Draconique","Pleiadiens","Arthuriens","Yoribiens","Elfen","Orquanien","Machine"]
        var rang=["subordonné","chef","dirigeant","membre","adepte","affilié","cotisant","participant","soutien"]
        var amour=race[Math.floor(Math.random()*race.length)]+" "+rang[Math.floor(Math.random()*rang.length)]+" "+organisation[Math.floor(Math.random()*organisation.length)];
        this.actor.update({'system.caractere.amour': amour});
        var ami=race[Math.floor(Math.random()*race.length)]+" "+rang[Math.floor(Math.random()*rang.length)]+" "+organisation[Math.floor(Math.random()*organisation.length)];
        this.actor.update({'system.caractere.amitie': ami});
        var haine=race[Math.floor(Math.random()*race.length)]+" "+rang[Math.floor(Math.random()*rang.length)]+" "+organisation[Math.floor(Math.random()*organisation.length)];
        this.actor.update({'system.caractere.haine': haine});
        var profession=["Voleur","Pilote","Artisan","Assassin","Garde","Marchand","Artisan","Chasseur","Chasseur de prime","Contrebandier","Vagabon","Navigateur","Aubergiste","Charlatant","Artiste","Diplomate","Fonctionnaire","Livreur","Soldat","Mercenaire"]
        var metier=profession[Math.floor(Math.random()*profession.length)]
        this.actor.update({'system.caractere.principale': metier});
        var metier=profession[Math.floor(Math.random()*profession.length)]
        this.actor.update({'system.caractere.secondaire': metier});
        var loisir=["Chasse","Tricot","Crochet","Broderie","Peinture","Poésie","Chant","Acrobatie","Danse","Manger","Promenade","Peche","Equitation","Carte","Jeux d'argent","Coureur de jupon","Vol","Jardiner","Lecture","Dessin","Poterie"]
        var metier=loisir[Math.floor(Math.random()*loisir.length)]
        this.actor.update({'system.caractere.passion': metier});
        var caracterelist=["Social","Individualiste","Altruiste","Fidéle","Infidel","Egoïsme","Générosité","Compassion","Fraternel","Dévoué","Croyant","Vaniteux","Forcené"]
        var caractere=caracterelist[Math.floor(Math.random()*caracterelist.length)]
        this.actor.update({'system.caractere.caract': caractere});
        var personnalitelist=["Compléxé(e)","Débrouillard","Assisté(e)","Maniaque","Bordelique","Patient","Impatient","Supersticieux","Rationnel","Emotif","Apathique","Flégmatique","Précieux","Bourru","Colérique","Sérieux","Mélancolique","Sanguin"]
        var personnalite=personnalitelist[Math.floor(Math.random()*personnalitelist.length)]
        this.actor.update({'system.caractere.personnalite': personnalite});
        var visionlist=["barbare","danger","découverte","connaissance","richesse","impie","démon","coeur à prendre","monstre","gibier","mystère","bandit","secte","croyance"]
        var vision="Rempli de "+visionlist[Math.floor(Math.random()*visionlist.length)]
        this.actor.update({'system.caractere.perception': vision});
        var objectiflist=["Devenir riche","Liberer de leur servitude","Aider sa communauté","Aider la nature","Recherche spirituel","Tuer les autres race","Recherche de connaissance"]
        var objectif=objectiflist[Math.floor(Math.random()*objectiflist.length)]
        this.actor.update({'system.caractere.objectif': objectif});
        var racunelist=["oui","non","Dépend de la situation"]
        var racune=racunelist[Math.floor(Math.random()*racunelist.length)]
        this.actor.update({'system.caractere.rancunier': racune});
        var tarelist=["Ablutophobie – Peur de se baigner. Cette phobie est plus une peur de la noyade qu'une peur de l'eau.","Acarophobie – Peur des parasites de la peau, des acariens.","Achluophobie – Peur de l'obscurité et du noir.","Achmophobie / Aichmophobie – Peur des aiguilles et des objets pointus (ciseaux, couteaux, seringues par exemple).","Acrophobie – Peur des hauteurs ; s'accompagne souvent de vertiges.","Administrativophobie – Peur des relations avec l'administration et des courriers administratifs.","Anasthesiaphobie - Peur de l'anesthésie.","Aérodromophobie – Peur de l'avion, des voyages en avion.","Aérophobie – Peur de l'air et du vent.","Agoraphobie – Peur des espaces publics et, par extension, de la foule ; plus généralement, des espaces où la fuite est rendue difficile (foule, mais aussi lieux déserts).","Algophobie – Peur de la douleur.","Alopophobie – Peur des chauves.","Amatophobie – Phobie de la poussière.","Amaxophobie – Peur de la conduite.","Anginophobie – Peur de l’étouffement, notamment par des angines de poitrine.","Angrophobie – Peur de se mettre en colère en public.","Ankylophobie – Peur de l'immobilité.","Anthelmophobie – Peur des vers.","Anthropophobie – Peur des gens ou d'être en leur compagnie, une forme de phobie sociale.","Anuptaphobie – Peur du célibat.","Apéirophobie – Peur de l'infini.","Apopathodiaphulatophobie – Peur d'être constipé ou de la constipation en elle-même.","Apopathophobie – Peur d'aller à la selle.","Aquaphobie – Peur de l’eau.","Arithmophobie – Peur des chiffres.","Asthénophobie – Peur de s'évanouir","Astraphobie – Peur du tonnerre.","Athazagoraphobie – Peur d'être oublié ou ignoré.","Atychiphobie – Peur de l’échec.","Automysophobie – Peur d'être sale, de sentir mauvais.","Autophobie – Peur de la solitude.","Aviophobie – Peur de prendre l'avion.","Bacillophobie – Peur des bacilles, des bactéries,.","Basophobie – Peur de marcher.","Bélénophobie – Peur des aiguilles (cf. achmophobie).","Blemmophobie – Peur du regard des autres.","Borbophobie – Peur des gargouillements.","Brontophobie – Peur du tonnerre.","Cancérophobie – Peur du cancer.","Cardiophobie – Peur du cœur ou peur d'un développement d'une maladie cardiovasculaire.","Carpophobie - Peur des fruits","Catapédaphobie – Peur de grimper en hauteur.","Cherophobie – Peur de la gaieté.","Chorophobie – Peur de danser.","Claustrophobie – Peur des espaces confinés.","Climacophobie – Peur d'utiliser des escaliers, surtout de les descendre.","Coemetiriophobie - Peur des cimetières.","Coulrophobie – Peur des clowns.","Cyclophobie – Peur de monter sur une bicyclette ou tout autre véhicule à deux roues.","Dentophobie – Peur du dentiste.","Dysmorphophobie / Dysmorphophie – Peur des anomalies physiques.","Ecclesiophobie – Peur des églises[réf. souhaitée].","Émétophobie – Peur de vomir.","Epistaxiophobie – Peur des saignements de nez.","Éreutophobie (ou l'érythrophobie)– Peur de rougir en public.","Fumiphobie – Peur de la fumée (tabac par exemple)","Géphyrophobie – Peur des ponts (ou de traverser les ponts).","Gérascophobie – Peur de vieillir.","Germophobie – Peur des germes.","Glossophobie – Peur de parler en public.","Graphophobie – Peur de l'écriture (fait d'écrire).","Gymnophobie – Peur de la nudité.","Halitophobie – Peur d'avoir mauvaise haleine.","Haptophobie (ou Aphenphosmophobie) – Peur d'être touché.","Hématophobie – Peur du contact et de la vue du sang.","Hylophobie – Peur des forêts.","Hypégiaphobie – Peur des responsabilités.","Ithyphallophobie / Medorthophobie – Peur de voir des pénis en érection.","Katagélophobie – Peur du ridicule.","Kénophobie – Peur de l'obscurité.","Kéraunophobie - Crainte morbide de la foudre et des orages.","Kopophobie – Peur d'être fatigué, ou de la fatigue elle-même.","Laxophobie – Peur d’être pris de diarrhées impérieuses en public, en dehors de chez soi, et de ne pas arriver à se retenir.","Leucosélophobie – Peur de la page blanche (blocage de l'écrivain) .","Lilapsophobie - Peur des tornades.","Maskaphobie – Peur des masques.","Mégalophobie – Peur des grands objets, des grands bâtiments (Gratte-ciel ou navires de croisière par exemple)","Musicophobie – Peur de la musique.","Mycophobie – Peur des champignons.","Mysophobie – Peur de la saleté, de la contamination par les microbes.","Nanopabulophobie – Peur des nains de jardin à brouette.","Nanophobie – Peur des nains.","Nécrophobie – Peur des cadavres.","Nélophobie – peur du verre (également Hyalophobie).","Néphobie – peur de l'inédit.","Néphrophobie – peur des maladie du rein (également Lithophobie).","Neurasthénophobie – peur de la tristesse.","Névrophobie – peur des crises de nerf (également Hystérophobie).","Nicophobie – peur des cigarettes.","Nomophobie – Peur d'être séparé de son téléphone portable. Cette phobie désignerait aussi la peur excessive des lois.","Nosocomephobie – Peur des hôpitaux, cliniques et centres de soin en général.","Nosophobie – Peur de la maladie, d'être malade.","Notaphobie – peur des factures (également Votaphobie).","Nourinophobie – peur des cochons (également Suidéphobie).","Nudophobie – peur ou réprobation de la nudité humaine.","Nulophobie – peur de la cité.","Numérophobie – peur des numéros.","Numismatophobie – peur des monnaies.","Ochlophobie – Peur de la foule.","Odontophobie – Peur du chirurgien-dentiste / des actes médicaux ou chirurgicaux en bouche.","Ombilicophobie - Peur du nombril, ne supporte pas d'y toucher ou de le voir","Paraskevidékatriaphobie – Peur des vendredis ","Pantophobie – Peur de tout","Pédiophobie – Peur des poupées","Pédophobie - Peur des enfants.","Phagophobie – Peur de s'étouffer avec des aliments.","Phasmophobie – Peur des fantômes.","Philophobie - Peur de tomber amoureux.","Philématophobie - Peur d'embrasser.","Protophiphouphobie - Peur de manquer de protéines ","Phobie de type sang-injection-blessure – Sous-type de phobies spécifiques classifié dans le DSM-IV.","Phobie sociale – Peur des ou de certaines situations sociales.","Phobophobie – Peur d'avoir peur (d'être surpris).","Pogonophobie – Aversion envers les barbes / phobie des poils du menton et des joues.","Podophobie – Peur des pieds","Psychopathophobie – Peur de devenir fou.","Pyrophobie – Peur du feu.","Scatophobie – Peur des excréments.","Scopophobie – Peur du regard des autres.","Sélénophobie – Peur de la lune.","Sidérodromophobie – Peur de voyager en train.","Spectrophobie – Peur des miroirs (des reflets).","Spitophobie - Peur de la salive","Stasophobie – Peur d'avoir à rester debout.","Taphophobie – Peur des tombes ou d'être enterré vivant.","Téléphonophobie – Peur de répondre au téléphone.","Tératophobie – Peur des monstres.","Thalassophobie – Peur de la mer.","Thanatophobie – Peur de la mort.","Théophobie – Peur de Dieu.","Tokophobie – Peur d'accoucher.","Trichophobie – Peur des poils et de la pilosité.","Trypophobie – Peur des trous.","Xénoglossophobie : Peur des langues étrangères.","Ailurophobie – Peur des chats.","Alektorophobie – Peur des poulets.","Anthelmophobie – Peur des vers.","Apiphobie – Peur des abeilles ; par extension, peur des insectes possédant un dard ou pouvant piquer.","Arachnophobie – Peur des araignées.","Chiroptophobie – Peur des chauves-souris","Cuniculophobie – Peur des lapins.","Cynophobie – Peur des chiens.","Entomophobie – Peur des insectes.","Héliciphobie - Peur des escargots et des limaces.","Herpétophobie – Peur des reptiles ou amphibiens.","Hippophobie – Peur des chevaux, des équidés.","Ichthyophobie – Peur des poissons.","Musophobie – Peur des souris ou rats.","Myrmécophobie – Peur des fourmis.","Octophobie- Peur des poulpes/pieuvres.","Ophiophobie – Peur des serpents.","Ornithophobie – Peur des oiseaux.","Squalophobie – Peur des requins."]
        var tare=tarelist[Math.floor(Math.random()*tarelist.length)]
        this.actor.update({'system.caractere.tare': tare});
        var obsessionlist=["oui","non","Dépend de la situation"]
        var obsession=obsessionlist[Math.floor(Math.random()*obsessionlist.length)]
        this.actor.update({'system.caractere.obsession': obsession});
        var distinguelist=["oui","non","Dépend de la situation"]
        var distingue=distinguelist[Math.floor(Math.random()*distinguelist.length)]
        this.actor.update({'system.caractere.distingue': distingue});
    }

    _onStory2(event){
        var age = Math.floor((Math.random() * 34) + 16);
        var items0=["sur une planète du secteur de","sur"];
        var items1=["End-125","Proxima","Atarus","Sebos","ZX52","DX-128","ROF-89","HD-720P","Quenza","Sigma","TK86","Talouine","Turka","Rota","Imperator","Reset","Creab","87AB","TH5","R852","Natura","F10-X","Tella","Olympus","Iron","Zeus","Athena","Gaia","Apollon","Gallus","M-IP","Elysée","Grande nébuleuse","Tartare","Alexandrie","Maxima","74P-R","Centaurus","Nouvelle Terre","END-128","Terre","HAT-P1B","Valhala","Mystérious"]
        var items2=["ta ville se fait attaqué","tu es affecté à une mission importante pour ta faction","un proche meurt assassiné","tu quittes ta planète pour voyager et découvrir le monde","des contrebandiers t'entrainent dans leurs magouilles","tu te fais capturer par une faction ennemi","tu es recruté par un étrange personnage pour une mission","un ami proche se fait enlever", "ton père meurt durant une bataille", "tu te fais kidnapper par un inconnu","tu es porté disparu durant une bataille", "tu es victime d'une tentative d’assassinat","durant un accident tu perds la mémoire","ton frère a disparu","ton hamster te confie une mission"];
        var items3=["de ramener la paix au sein de la galaxie","de rechercher un moyen que ton nom reste dans les mémoires","de tuer les personnes qui sont responsables de tes malheurs","de sauver se monde ronger par la guerre","d'anéantir les personnes que tu juge trop faible","de partir en quête d'aventure","de te venger du mal qui ta été fait","de partir en quête de savoir","de partir t'enrichir","de devenir le plus fort","de rechercher l'amour","de devenir connu","d'enquêter sur des événements étranges","d'attraper tous les pokémons"];
        var items4=["fasciné par la culture des autres races","animé par une soif de connaissance","expert dans ton domaine","par amour propre","pour fuir ton destin","après en avoir longuement réfléchit","par amour","par envie","par vengeance","par nécessité","par jalousie","par curiosité","par choix","après un tragique événement","par colère","par hasard"];

        var secteur=items0[Math.floor(Math.random()*items0.length)];
        var planete = items1[Math.floor(Math.random()*items1.length)];
        var evenement=items2[Math.floor(Math.random()*items2.length)];
        var tonchoix=items4[Math.floor(Math.random()*items2.length)];
        var motivation  = items3[Math.floor(Math.random()*items3.length)];
        var textgen ="Agé de "+age+" tu fais ta vie "+secteur+" "+planete+". Jusqu'au jour où "+evenement+", "+motivation+" tu décide "+tonchoix+".";
        this.actor.update({'system.background.histoire': textgen});
    }

    _onAvantageRace(event){
        var clanliste=this.actor.system.background.race;

        var bonusrace='';
        if(clanliste==game.i18n.localize("libersf.humain")){
            bonusrace="10 Dextérité et solidarité entre humain";
        }else if(clanliste==game.i18n.localize("libersf.artu")){
            bonusrace="10 Connaissance générale et Kamikaze";
        }else if(clanliste==game.i18n.localize("libersf.dragon")){
            bonusrace="10 Force et récupération rapide (+5PV /jour)";
        }else if(clanliste==game.i18n.localize("libersf.machine")){
            bonusrace="10 Piratage et accès au réseau intermachine";
        }else if(clanliste==game.i18n.localize("libersf.pleiadiens")){
            bonusrace="10 Pistage et capacité de résurrection";
        }else if(clanliste==game.i18n.localize("libersf.yor")){
            bonusrace="10 Perception et sixième sens";
        }else if(clanliste==game.i18n.localize("libersf.elf")){
            bonusrace="10 Agilité et Technophile";
        }else if(clanliste==game.i18n.localize("libersf.orqu")){
            bonusrace="10 Combat et double arme";
        }else {
            bonusrace="";
        }
        this.actor.update({'system.background.bonusrace': bonusrace});
    }
    _onAvantageJob(event){
        var metierliste=this.actor.system.background.metier;
        console.log(metierliste)
        var metier='';
        if(metierliste==game.i18n.localize("libersf.metier1")){
            metier="10 Artisanat";
        }else if(metierliste==game.i18n.localize("libersf.metier2")){
            metier="10 Négociation";
        }else if(metierliste==game.i18n.localize("libersf.metier3")){
            metier="10 Survie";
        }else if(metierliste==game.i18n.localize("libersf.metier4")){
            metier="10 Investigation";
        }else if(metierliste==game.i18n.localize("libersf.metier5")){
            metier="10 Discrétion";
        }else if(metierliste==game.i18n.localize("libersf.metier6")){
            metier="10 Pilote";
        }else if(metierliste==game.i18n.localize("libersf.metier7")){
            metier="10 Médecine";
        }else if(metierliste==game.i18n.localize("libersf.metier8")){
            metier="10 Tir";
        }else if(metierliste==game.i18n.localize("libersf.metier9")){
            metier="10 Mécanique";
        }else if(metierliste==game.i18n.localize("libersf.metier10")){
            metier="10 Science";
        }else if(metierliste==game.i18n.localize("libersf.metier11")){
            metier="10 Magie";
        }
        console.log(metier)
        this.actor.update({'system.background.bonusmetier': metier});
    }
    _onArmor(event){
        var genre=event.target.dataset["genre"];
        var objetaequipe=event.target.dataset["name"];
        var type=event.target.dataset["type"];
        var etoile=event.target.dataset["etoile"];

        if(genre=="arme" ){
            var degat=event.target.dataset["degat"]; 
            this.actor.update({'system.degatd': degat,'system.armed':objetaequipe,'system.typed':type,'system.etoiled':etoile});
        }else if(genre=="Armure"  || genre=="Combinaison"){
            var hp=event.target.dataset["hp"]; 
            var hpmax=event.target.dataset["hpmax"]; 
            this.actor.update({'system.stat.armure.value': hp,'system.stat.armure.max': hpmax,'system.prog':objetaequipe});
        }else if(genre=="Champ de force"){
            var hp=event.target.dataset["hp"]; 
            var hpmax=event.target.dataset["hpmax"]; 
            this.actor.update({'system.stat.protections.value': hp,'system.stat.protections.max': hpmax,'system.prod':objetaequipe});
        }else if(genre=="Chargeur"){
            this.actor.update({'system.charged':objetaequipe});
        }else{
            this.actor.update({'system.autre':objetaequipe});
        } 
    }
    _onDesArmor(event){
        var genre=event.target.dataset["genre"];
        if(genre=="arme" ){
            this.actor.update({'system.degatd': '','system.armed':''});
        }else if(genre=="armure"){
            this.actor.update({'system.stat.armure.value': 0,'system.stat.armure.max': 0,'system.prog':''});
        }else if(genre=="bouclier"){
            this.actor.update({'system.stat.protections.value': 0,'system.stat.protections.max': 0,'system.prod':''});
        }else if(genre=='chargeur'){
            this.actor.update({'system.charged':''});
        }else if(genre=='autre'){
            this.actor.update({'system.autre':''});
        } 
    }

    _onNivArmor(event){
        var arm=this.actor.system.stat.armure.value;
        var armmax=this.actor.system.stat.armure.max;
        var bou=this.actor.system.stat.protections.value;
        var boumax=this.actor.system.stat.protections.max;
        var armname=this.actor.system.prog;
        var bouname=this.actor.system.prod;
        if(arm==''){arm=0}
        if(armmax==''){armmax=0}
        if(bou==''){bou=0}
        if(boumax==''){boumax=0}
        /*var modifarmure=1;
        actarm=Math.floor(parseInt(actarm)/modifarmure);
        actbou=Math.floor(parseInt(actbou)/modifarmure);*/
        this.actor.update({'system.ptarm':arm,'system.ptbou':bou});
        if(arm != 0){
            let itemData= this.actor.items.filter(i=>i.name == armname);                 
            itemData[0].DegatArm(arm,armmax);
        }
        if(bouname != 0){
            let itemData2= this.actor.items.filter(i=>i.name == bouname);                 
            itemData2[0].DegatArm(bou,boumax);
        }
    }

    _onAleatoire(event){
        var race=["Chien","Serpent","Vermine","Ourse","Sangsue","Lézard","Oiseau","Araignée","Chimère","Grenouille"]
        var carc=["féroce","sombre","immense","redoutable","inquiétante","étrange","rouge","invisible","invinsible"]
        var lieu=["des enfers","des ombres","d'outre tombe"]
        var type=["volant","sous terrain","marin"]
        var effe=["paralyse","empoisonne","detecte sur l'infra-rouge","detecte l'odeur de","detecte la chaleur de","detecte l'énergie de","crahe","lance des épines","se camoufle de","prend l'apparence de"]
        var img='systems/libersf/assets/icon/monstre.jpg';
        var nom= race[Math.floor(Math.random()*race.length)];
        var o=Math.random()*100;
        if(o>50){
            nom+=' '+carc[Math.floor(Math.random()*carc.length)];
        }
        o=Math.random()*100;
        if(o>50){
            nom+=' '+lieu[Math.floor(Math.random()*lieu.length)];
        }
        var t= type[Math.floor(Math.random()*type.length)];
        var e= effe[Math.floor(Math.random()*effe.length)];
        var dgt=Math.floor((Math.random()*5)*10);
        var ar=Math.floor((Math.random()*5)*10);
        var pv=Math.floor((Math.random()*5+1)*10);
        var desc=nom+' est un animal '+t+' qui '+e+' ses ennemis. Il inflige '+dgt+' et à une armure de '+ar+' et à '+pv+'PV'
        var cpt=[]
        var valeur=[-30,-20,-10,0,10,20,30,40]
        for (var i =0; i < 26; i++) {
            var v= valeur[Math.floor(Math.random()*valeur.length)];
            cpt.push(v);
        }
        this.actor.update({'name':nom,'img':img,'system.background.histoire':desc,'system.stat.hp.value': pv,'system.stat.hp.max': pv,'system.degatd': dgt,'system.armed':'Attaque','system.stat.armure.value': ar,'system.stat.armure.max': ar,'system.ptarm': ar,'system.prog':'armure Naturel','system.Agilité':cpt[0],'system.Artisanat':cpt[1],'system.Balistique':cpt[2],'system.Combat':cpt[3],'system.ConGén':cpt=[4],'system.ConSpécif':cpt=[5],'system.Dextérité':cpt=[6],'system.Diplomatie':cpt=[7],'system.Discrétion':cpt=[8],'system.Force':cpt=[9],'system.Investigation':cpt=[10],'system.Jeu':cpt=[11],'system.Mécanique':cpt=[12],'system.Médecine':cpt=[13],'system.Natation':cpt=[14],'system.Navigation':cpt=[15],'system.Négociation':cpt=[16],'system.Perception':cpt=[17],'system.Pilotage':cpt=[18],'system.Piratage':cpt=[19],'system.Pistage':cpt=[20],'system.Religion':cpt=[21],'system.Science':cpt=[22],'system.Survie':cpt=[23],'system.Tir':cpt=[24],'system.Visée':cpt=[25]});
    }

    _onCouv(event){
        let idn=event.target.dataset["lettre"];  //recupére l'id du bouton
        let etats=['a','b','c','d','e','f','g','h','i','j','k','l','m','n'];
        var active=[this.actor.system.background.etat.a, this.actor.system.background.etat.b, this.actor.system.background.etat.c, this.actor.system.background.etat.d, this.actor.system.background.etat.e, this.actor.system.background.etat.f, this.actor.system.background.etat.g, this.actor.system.background.etat.h, this.actor.system.background.etat.i, this.actor.system.background.etat.j, this.actor.system.background.etat.k, this.actor.system.background.etat.l, this.actor.system.background.etat.m, this.actor.system.background.etat.n]
        let lists=['Endormi','Etourdi','Aveugle','Sourd','Réduit au silence','Apeuré','Brûlant','Gelé','Invisible','Béni','Empoisonné','Saignement','Inconscient','Mort']
        let icon=['sleep','daze','blind','deaf','silenced','terror','fire','frozen','invisible','angel','poison','blood','unconscious','dead']
        if(idn==13){
            var etat=this.actor.system.background.etat.n;
            if(etat==1){
                this.actor.update({"system.background.etat.n":0.5});    
            }else {
                this.actor.update({"system.background.etat.n":1});      
            }
        }else {
            let effet=this.actor.effects;
            var ids=null;
            let etat=active[idn];
            if(etat==0.5){
                this.actor.createEmbeddedDocuments("ActiveEffect", [
                  {label: lists[idn], icon: 'icons/svg/'+icon[idn]+'.svg', flags: { core: { statusId: icon[idn] } } }
                ]);
                this.actor.update({[`system.background.etat.${etats[idn]}`]:1});
            }else {
                
                effet.forEach(function(item, index, array) {
                    if(item.label==lists[idn]){
                        ids=item.id;
                    }
                });            
                this.actor.deleteEmbeddedDocuments("ActiveEffect", [ids]);
                this.actor.update({[`system.background.etat.${etats[idn]}`]:0.5});
            }
        }
    }

    _onVehi(event){
        var type=this.actor.system.type;
        var tail=this.actor.system.taille;
        var ia=this.actor.system.ia;
        var mote=this.actor.system.moteur;
        var blin=this.actor.system.blindage;
        var prix=0;var pv=350;var nbequi=2;var nbpiece=0;var types="";var tailles="";
        var tete=0;var bd=0;var bg=0;var jd=0;var nav=0;var pil=0;var vis=0;var dis=0;var per=0;var med=0;var inv=0;var mec=0;var com=0;var pir=0;
        if(type==1){
            prix=650;types=game.i18n.localize("libersf.type1");
        }else if(type==2){
            prix=350;types=game.i18n.localize("libersf.type2");
        }else if(type==3){
            prix=850;types=game.i18n.localize("libersf.type3");
        }else if(type==4){
            prix=5500;types=game.i18n.localize("libersf.type4");
        }
        if(tail==1){
            prix=prix+prix*(parseInt(ia)+parseInt(mote)+parseInt(blin));tailles=game.i18n.localize("libersf.taille1");
        }else if(tail==2){
            prix=prix+prix*(2+parseInt(ia)*2+parseInt(mote)*2+parseInt(blin)*2);pv=pv*2;nbequi=nbequi*2;nbpiece=nbpiece+2;tailles=game.i18n.localize("libersf.taille2");
        }else if(tail==3){
            prix=prix+prix*(3+parseInt(ia)*3+parseInt(mote)*3+parseInt(blin)*3);pv=pv*4;nbequi=nbequi*3;nbpiece=nbpiece+4;tailles=game.i18n.localize("libersf.taille3");
        }else if(tail==4){
            prix=prix+prix*(100+parseInt(ia)*5+parseInt(mote)*5+parseInt(blin)*5);pv=pv*8;nbequi=nbequi=100;nbpiece=100;tailles=game.i18n.localize("libersf.taille4");
        }
        var ptrestant=0;
        if(ia=="0.5"){
            ptrestant=60;
            nav=-20;pil=-20;vis=-20;
        }else if(ia=="1"){
            ptrestant=30;
            nav=-10;pil=-10;vis=-10;
        }else if(ia=="1.5"){
            //ptrestant=400;
        }else if(ia=="2"){
            ptrestant=-30;
            nav=10;pil=10;vis=10;
        }else if(ia=="2.5"){
            ptrestant=-60;
            nav=20;pil=20;vis=20;
        }else if(ia=="3"){
            ptrestant=-90;
            nav=20;pil=20;vis=20;dis=10;per=10;med=10;
        }else if(ia=="3.5"){
            ptrestant=-120;
            nav=20;pil=20;vis=20;dis=20;per=20;med=20;   
        }else if(ia=="4"){
            ptrestant=-150;
            nav=20;pil=20;vis=20;dis=20;per=20;med=20;mec=10;com=10;pir=10;
        }else if(ia=="4.5"){
            ptrestant=-180;
            nav=20;pil=20;vis=20;dis=20;per=20;med=20;mec=20;com=20;pir=20;
        }else if(ia=="5"){
            ptrestant=-210;
            nav=30;pil=30;vis=30;dis=20;per=20;med=20;mec=20;com=20;pir=20;
        }
        var bouclier=0;
        if(mote=="0.5"){
            tete=50;bd=50;bg=50;jd=50;bouclier=200
        }else if(mote=="1"){
            tete=100;bd=100;bg=100;jd=100;bouclier=400
        }else if(mote=="1.5"){
            tete=200;bd=150;bg=150;jd=100;bouclier=600
        }else if(mote=="2"){
            tete=200;bd=200;bg=200;jd=200;bouclier=800
        }else if(mote=="2.5"){
            tete=300;bd=250;bg=250;jd=200;bouclier=1000
        }else if(mote=="3"){
            tete=300;bd=300;bg=300;jd=300;bouclier=1200
        }else if(mote=="3.5"){
            tete=400;bd=350;bg=350;jd=300;bouclier=1400 
        }else if(mote=="4"){
            tete=400;bd=400;bg=400;jd=400;bouclier=1600
        }else if(mote=="4.5"){
            tete=500;bd=450;bg=450;jd=400;bouclier=1800
        }else if(mote=="5"){
            tete=500;bd=500;bg=500;jd=500;bouclier=2000
        }
        var blindage=0;
        if(blin=="0.5"){
            blindage=200
        }else if(blin=="1"){
            blindage=400
        }else if(blin=="1.5"){
            blindage=600
        }else if(blin=="2"){
            blindage=800
        }else if(blin=="2.5"){
            blindage=1000
        }else if(blin=="3"){
            blindage=1200
        }else if(blin=="3.5"){
            blindage=1400 
        }else if(blin=="4"){
            blindage=1600
        }else if(blin=="4.5"){
            blindage=1800
        }else if(blin=="5"){
            blindage=2000
        }
       
        var moyen=(ia+blin+mote)/3;var etoile="";
        if(moyen<=0.5){
            etoile="✬ ☆ ☆ ☆ ☆";
        }else if(moyen<=1){
            etoile="★ ☆ ☆ ☆ ☆";
        }else if(moyen<=1.5){
            etoile="★ ✬ ☆ ☆ ☆";
        }else if(moyen<=2){
            etoile="★ ★ ☆ ☆ ☆";
        }else if(moyen<=2.5){
            etoile="★ ★ ✬ ☆ ☆";
        }else if(moyen<=3){
            etoile="★ ★ ★ ☆ ☆";
        }else if(moyen<=3.5){
            etoile="★ ★ ★ ✬ ☆";
        }else if(moyen<=4){
            etoile="★ ★ ★ ★ ☆";
        }else if(moyen<=4.5){
            etoile="★ ★ ★ ★ ✬";
        }else{
            etoile="★ ★ ★ ★ ★";
        }
        
        
        this.actor.update({"system.attributs.Agilité":0,"system.attributs.Artisanat":0,"system.attributs.Balistique":0,"system.attributs.Combat":0,"system.attributs.ConGén":com,"system.attributs.Visée":vis,"system.attributs.ConSpécif":0,"system.attributs.Négociation":0,"system.attributs.Dextérité":0,"system.attributs.Diplomatie":0,"system.attributs.Discrétion":dis,"system.attributs.Force":0,"system.attributs.Investigation":inv,"system.attributs.Jeu":0,"system.attributs.Mécanique":mec,"system.attributs.Médecine":med,"system.attributs.Natation":0,"system.attributs.Navigation":nav,"system.attributs.Perception":per,"system.attributs.Pilotage":pil,"system.attributs.Piratage":pir,"system.attributs.Pistage":0,"system.attributs.Religion":0,"system.attributs.Science":0,"system.attributs.Survie":0,"system.attributs.Tir":0,"system.stat.tete":tete,"system.stat.tete2":tete,"system.stat.bd":bd,"system.stat.bd2":bd,"system.stat.bg":bg,"system.stat.bg2":bg,"system.stat.jd":jd,"system.stat.jd2":jd,"system.model":etoile,"system.tailles":tailles,"system.types":types,"system.prix":prix,"system.prixbase":prix,"system.equi":nbequi,"system.piece":nbpiece,"system.stat.hp.value":pv,"system.stat.hp.max":pv,"system.pointrestant2":ptrestant,"system.stat.armure.value":blindage,"system.stat.armure.max":blindage,"system.stat.protections.value":bouclier,"system.stat.protections.max":bouclier}); 
    }

    _onEncom(data){
        const adata = data.actor;
        var  exo = adata.system.prog;
        var enc=parseInt(adata.system.attributs.Force) /2 + 35; 
        if(exo=='Exosquelette'){
           enc=enc*2; 
        }
        console.log('Encombrement:'+enc)
        this.actor.update({"system.stat.encombrement.max":enc});
    }

    _onEarth(event){
        var fact=Math. round(Math.random() * 4);
        var arme=Math. round(Math.random() * 11);
        var secu=Math. round(Math.random() * 11);
        var crim=Math. round(Math.random() * 11);
        var tech=Math. round(Math.random() * 11);
        var pv=Math. round(Math.random() * 1000)*1000000;
        var pop=Math. round(Math.random() * 1000)*1000;
        let faction=['Empire','OMC','Mafia','Fédération'];
        let etoile=["☆ ☆ ☆ ☆ ☆","✬ ☆ ☆ ☆ ☆","★ ☆ ☆ ☆ ☆","★ ✬ ☆ ☆ ☆","★ ★ ☆ ☆ ☆","★ ★ ✬ ☆ ☆","★ ★ ★ ☆ ☆","★ ★ ★ ✬ ☆","★ ★ ★ ★ ☆","★ ★ ★ ★ ✬","★ ★ ★ ★ ★"]
        var nom=['Noxaqum','Terioll','Kimabas','Kepler','Luyten','Gliese','HD']
        var abc=['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
        var surnom1=['Planète','Zone','Reine','Super','Naine','Nébuleuse','Perle']
        var surnom2=['émeraude','saphir','infini','morte','géante','diamant','bleue','noire','rouge','mercure','rocailleuse']
        var type=['une planète desertique','un super continent','une série d\'îles et d\'archipèle','une planète océan','une planète rocailleuse','une jungle luxuriante','une planète glacée']
        var type2=['de nombreuse villes','des animaux dangereux','un faune rare','des volcans très actifs','une techtonique des plaques très active','de violents cyclones et tempêtes','des éruptions solaires fréquentes']
        var huma=0; var drac=0;var plei=0;var elfe=0;var orqa=0;var artu=0;var mach=0;var yori=0;
        if(fact==1){
           huma=Math. round(Math.random() * 11);
           drac=Math. round(Math.random() * (11-huma));
           mach=10-huma-drac;
        }else if(fact==2){
           elfe=Math. round(Math.random() * 11);
           plei=Math. round(Math.random() * (11-huma));
           mach=10-elfe-plei;
        }else if(fact==3){
           orqa=Math. round(Math.random() * 11);
           artu=Math. round(Math.random() * (11-huma));
           mach=10-orqa-artu;
        }else if(fact==4){
           artu=Math. round(Math.random() * 11);
           yori=Math. round(Math.random() * (11-huma));
           mach=10-yori-artu;
        }
        var name=nom[Math. round(Math.random() * 7)]+'-'+Math. round(Math.random() * 1000)+abc[Math. round(Math.random() * 26)];
        var surnom=surnom1[Math. round(Math.random() * surnom1.length)]+' '+surnom2[Math. round(Math.random() * surnom2.length)];
        var histoire='C\'est '+type[Math. round(Math.random() * type.length)]+' avec '+type2[Math. round(Math.random() * type2.length)];
        var img='systems/libersf/assets/planete/p'+Math. round(Math.random() * 16)+'.png';
        this.actor.update({"system.description":histoire,"system.surnom":surnom,'name':name,'img':img,"system.pop_humain":etoile[huma],"system.pop_arthuriens":etoile[artu],"system.pop_draconiens":etoile[drac],"system.pop_machine":etoile[mach],"system.pop_pleiadiens":etoile[plei],"system.pop_yoribiens":etoile[yori],"system.pop_elfen":etoile[elfe],"system.pop_orquanien":etoile[orqa],"system.domination":faction[fact],"system.stat.armure.value":pv,"system.stat.armure.max":pv,"system.niveau_arme":etoile[arme],"system.niveau_crime":etoile[crim],"system.niveau_secu":etoile[secu],"system.niveau_tech":etoile[tech],"system.stat.hp.value":pv,"system.stat.hp.max":pv,"system.pouplation":pop});
    }
    async _onStatM(event){
        let level=this.actor.system.background.level;
        let metier=this.actor.system.background.metier;
        let race=this.actor.system.background.race;
        let cpt0=this.actor.system.attributs.Agilité;
        let cpt1=this.actor.system.attributs.Artisanat;
        let cpt2=this.actor.system.attributs.Balistique;
        let cpt3=this.actor.system.attributs.Combat;
        let cpt4=this.actor.system.attributs.ConGén;
        let cpt5=this.actor.system.attributs.ConSpécif;
        let cpt6=this.actor.system.attributs.Dextérité;
        let cpt7=this.actor.system.attributs.Diplomatie;
        let cpt8=this.actor.system.attributs.Discrétion;
        let cpt9=this.actor.system.attributs.Force;
        let cpt10=this.actor.system.attributs.Investigation;
        let cpt11=this.actor.system.attributs.Jeu;
        let cpt12=this.actor.system.attributs.Mécanique;
        let cpt13=this.actor.system.attributs.Médecine;
        let cpt14=this.actor.system.attributs.Natation;
        let cpt15=this.actor.system.attributs.Navigation;
        let cpt16=this.actor.system.attributs.Négociation;
        let cpt17=this.actor.system.attributs.Perception;
        let cpt18=this.actor.system.attributs.Pilotage;
        let cpt19=this.actor.system.attributs.Piratage;
        let cpt20=this.actor.system.attributs.Pistage;
        let cpt21=this.actor.system.attributs.Religion;
        let cpt22=this.actor.system.attributs.Science;
        let cpt23=this.actor.system.attributs.Survie;
        let cpt24=this.actor.system.attributs.Tir;
        let cpt25=this.actor.system.attributs.Visée;
        let cpt26=this.actor.system.attributs.magie;
        let cpt=[cpt0,cpt1,cpt2,cpt3,cpt4,cpt5,cpt6,cpt7,cpt8,cpt9,cpt10,cpt11,cpt12,cpt13,cpt14,cpt15,cpt16,cpt17,cpt18,cpt19,cpt20,cpt21,cpt22,cpt23,cpt24,cpt25,cpt26]
        if(level==1){
            for (var i = cpt.length - 1; i >= 0; i--) {
                if(metier==game.i18n.localize("libersf.metier1") && i==1 || 
                   metier==game.i18n.localize("libersf.metier2") && i==16|| 
                   metier==game.i18n.localize("libersf.metier3") && i==23|| 
                   metier==game.i18n.localize("libersf.metier4") && i==10|| 
                   metier==game.i18n.localize("libersf.metier5") && i==8 || 
                   metier==game.i18n.localize("libersf.metier6") && i==18|| 
                   metier==game.i18n.localize("libersf.metier7") && i==13|| 
                   metier==game.i18n.localize("libersf.metier8") && i==24|| 
                   metier==game.i18n.localize("libersf.metier9") && i==12|| 
                   metier==game.i18n.localize("libersf.metier10") && i==22|| 
                   metier==game.i18n.localize("libersf.metier11") && i==26||
                   race==game.i18n.localize("libersf.humain") && i==6 ||
                   race==game.i18n.localize("libersf.artu") && i==4 || 
                   race==game.i18n.localize("libersf.pleiadiens") && i==20 || 
                   race==game.i18n.localize("libersf.yor") && i==17 || 
                   race==game.i18n.localize("libersf.dragon") && i==9 || 
                   race==game.i18n.localize("libersf.elf") && i==0 || 
                   race==game.i18n.localize("libersf.machine") && i==19 || 
                   race==game.i18n.localize("libersf.orqu") && i==3){

                    if(cpt[i]>40){cpt[i]=40}else if(parseInt(cpt[i])<-20){cpt[i]=-20}
                }else if(cpt[i]>30){cpt[i]=30}else if(parseInt(cpt[i])<-30){cpt[i]=-30}

            }
        }
        if(parseInt(level)>1){
            for (var i = cpt.length - 1; i >= 0; i--) {
                if(race==game.i18n.localize("libersf.humain") && i==6 ||
                   race==game.i18n.localize("libersf.artu") && i==4 || 
                   race==game.i18n.localize("libersf.pleiadiens") && i==20 || 
                   race==game.i18n.localize("libersf.yor") && i==17 || 
                   race==game.i18n.localize("libersf.dragon") && i==9 || 
                   race==game.i18n.localize("libersf.elf") && i==0 || 
                   race==game.i18n.localize("libersf.machine") && i==19 || 
                   race==game.i18n.localize("libersf.orqu") && i==3){
                    if(parseInt(cpt[i])<-20){cpt[i]=-20}
                }
                if(parseInt(cpt[i])<-30){cpt[i]=-30}
            } 
        }
        
  



        //activer les effets
        let effet=this.actor.effects;
        var effets=[];
        //var etats=['a','b','c','d','e','f','g','h','i','j','k','l','m','n'];
        var active=[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
        var lists=['Endormi','Etourdi','Aveugle','Sourd','Réduit au silence','Apeuré','Brûlant','Gelé','Invisible','Béni','Empoisonné','Saignement','Inconscient','Mort']
        effet.forEach(function(item, index, array) {
            if(item.label!=''){
                effets.push(item.label);
            }
        });

        for(var i=0; i<lists.length; i++){
            for (var j=0; j < effets.length; j++) {
                if(lists[i]== effets[j]){
                    active[i]=1;
                    console.log(i+' : '+effets[j]) 
                }
            }
        }

        this.actor.update({"system.attributs.Agilité":cpt[0],"system.attributs.Artisanat":cpt[1],"system.attributs.Balistique":cpt[2],"system.attributs.Combat":cpt[3],"system.attributs.ConGén":cpt[4],"system.attributs.ConSpécif":cpt[5],"system.attributs.Dextérité":cpt[6],"system.attributs.Diplomatie":cpt[7],"system.attributs.Discrétion":cpt[8],"system.attributs.Force":cpt[9],"system.attributs.Investigation":cpt[10],"system.attributs.Jeu":cpt[11],"system.attributs.Mécanique":cpt[12],"system.attributs.Médecine":cpt[13],"system.attributs.Natation":cpt[14],"system.attributs.Navigation":cpt[15],"system.attributs.Négociation":cpt[16],"system.attributs.Perception":cpt[17],"system.attributs.Pilotage":cpt[18],"system.attributs.Piratage":cpt[19],"system.attributs.Pistage":cpt[20],"system.attributs.Religion":cpt[21],"system.attributs.Science":cpt[22],"system.attributs.Survie":cpt[23],"system.attributs.Tir":cpt[24],"system.attributs.Visée":cpt[25],"system.attributs.magie":cpt[26],"system.background.etat.a":active[0],"system.background.etat.b":active[1],"system.background.etat.c":active[2],"system.background.etat.d":active[3],"system.background.etat.e":active[4],"system.background.etat.f":active[5],"system.background.etat.g":active[6],"system.background.etat.h":active[7],"system.background.etat.i":active[8],"system.background.etat.j":active[9],"system.background.etat.k":active[10],"system.background.etat.l":active[11],"system.background.etat.m":active[12]});        
    }
}