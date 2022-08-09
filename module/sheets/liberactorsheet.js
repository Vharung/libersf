export class LiberActorSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
          classes: ["Liber", "sheet", "actor"],
          //template: "systems/liber/templates/actor/personnage-sheet.html",
          width: 1200,
          height: 800,
          tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    get template() {
        console.log(`Liber | Récupération du fichier html ${this.actor.data.type}-sheet.`);
        return `systems/libersf/templates/sheets/${this.actor.data.type}-sheet.html`;
    }

    getData(){
        const data = super.getData();
        var poidsactor='';
        data.dtypes = ["String", "Number", "Boolean"];
        console.log(data);        
        if (this.actor.data.type == 'personnage' || this.actor.data.type == 'pnj' || this.actor.data.type == 'monstre' | this.actor.data.type == 'vehicule') {
            this._prepareCharacterItems(data);
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
          let item = i.data;
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
        /*jet de dés*/
        //html.find('.jetdedes').click(this._onRoll.bind(this));

        /*edition items*/
        html.find('.item-edit').click(this._onItemEdit.bind(this));

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

        //html.find('.item-delete').click(this._onItemDelete.bind(this));
        $('.item-equip').on('click',function(){
            var objetaequipe=$(this).attr("name");
            var genre=$(this).attr("genre");
            var degat=$(this).attr("degat");
            var hpmax=$(this).attr("hpmax");
            if(genre=="arme" ){
                html.find(".armed").val(objetaequipe);
                html.find(".armed").attr('title',objetaequipe);
                html.find(".comptir").attr("data-armed",objetaequipe);
                html.find(".degatd").val(degat);
            }else if(genre=="Armure" || genre=="Combinaison"){
                html.find(".armurequi").val(objetaequipe);
                html.find(".armurequi").attr('title',objetaequipe);
                html.find(".actarmmax").val(hpmax);
            }else if(genre=="Champ de force"){
                html.find(".bouclierqui").val(objetaequipe);
                html.find(".bouclierqui").attr('title',objetaequipe);
                html.find(".actarmmax").val(actboumax);
            }else{
                html.find(".charged").val(objetaequipe);
                html.find(".charged").attr('title',objetaequipe);
                html.find(".comptir").attr("data-charged",objetaequipe);
            }
        });
        $('.desequi').on('click',function(){
            var objetaequipe=$(this).attr("name");
            var genre=$(this).attr("genre");
            var hpmax=0;
            if(genre=="arme"){
                html.find(".armed").val('');
                html.find(".armed").attr('title','');
                html.find(".comptir").attr("data-armed",'');
                html.find(".degatd").val(0);
            }else if(genre=="armure"){
                html.find(".armurequi").val('');
                html.find(".armurequi").attr('title','');
                html.find(".actarmmax").val(hpmax);
            }else if(genre=="bouclier"){
                html.find(".bouclierqui").val('');
                html.find(".bouclierqui").attr('title','');
                html.find(".actarmmax").val(actboumax);
            }else{
                html.find(".charged").val('');
                html.find(".charged").attr('title','');
                html.find(".comptir").attr("data-charged",'');
            }
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

        var modifarmure=1
        var actarm=html.find('.actarm').val();
        var actbou=html.find('.actbou').val();
        actarm=Math.floor(parseInt(actarm)/modifarmure);
        actbou=Math.floor(parseInt(actbou)/modifarmure);
        html.find('.ptarm').html(actarm);
        html.find('.ptbou').html(actbou);

        //choix Race
        html.find('.racechoix').on('click',function(){ 
            var clanliste=html.find('.raceliste').val();
            if(clanliste==game.i18n.localize("liber.humain")){html.find('.bonusrace').val("10 Dextérité et solidarité entre humain");}
            else if(clanliste==game.i18n.localize("liber.artu")){html.find('.bonusrace').val("10 Connaissance générale et Kamikaze");}
            else if(clanliste==game.i18n.localize("liber.dragon")){html.find('.bonusrace').val("10 Force et récupération rapide (+5PV /jour)");}
            else if(clanliste==game.i18n.localize("liber.machine")){html.find('.bonusrace').val("10 Piratage et accès au réseau intermachine");}
            else if(clanliste==game.i18n.localize("liber.pleiadiens")){html.find('.bonusrace').val("10 Pistage et capacité de résurrection");}
            else if(clanliste==game.i18n.localize("liber.yor")){html.find('.bonusrace').val("10 Perception et sixième sens");}
            else if(clanliste==game.i18n.localize("liber.elf")){html.find('.bonusrace').val("10 Agilité et polyglotte");}
            else if(clanliste==game.i18n.localize("liber.orqu")){html.find('.bonusrace').val("10 Combat et double arme");}
        });
        //choix metier
        html.find('.metierchoix').on('click',function(){
            var metierliste=html.find('.metierliste').val();
            var metier=html.find('.metier').val();
            if(metier==game.i18n.localize("liber.metier1")){html.find('.bonusmetier').val("10 Artisanat");}
            else if(metier==game.i18n.localize("liber.metier2")){html.find('.bonusmetier').val("10 Négociation");}
            else if(metier==game.i18n.localize("liber.metier3")){html.find('.bonusmetier').val("10 Survie");}
            else if(metier==game.i18n.localize("liber.metier4")){html.find('.bonusmetier').val("10 Investigation");}
            else if(metier==game.i18n.localize("liber.metier5")){html.find('.bonusmetier').val("10 Discrétion");}
            else if(metier==game.i18n.localize("liber.metier6")){html.find('.bonusmetier').val("10 Pilote");}
            else if(metier==game.i18n.localize("liber.metier7")){html.find('.bonusmetier').val("10 Médecine");}
            else if(metier==game.i18n.localize("liber.metier8")){html.find('.bonusmetier').val("10 Tir");}
            else if(metier==game.i18n.localize("liber.metier9")){html.find('.bonusmetier').val("10 Mécanique");}           
        });

        //choix faction
        html.find('.factionchoix').on('click',function(){ 
            var clanliste=html.find('.factionliste').val();
            html.find('.faction').val(clanliste);
        });

        //action couvert
        html.find('.action6').on('click',function(){
            html.find(".etats").val('aucun');
            html.find(".etat12").css({"opacity": "1"});
        });

        //calcul point restant
        var clanliste=html.find('.raceliste').val();
        var metierliste=html.find('.metierliste').val();
        var metier=html.find('.metier').val();
        var race=html.find('.race').val();
        var ptrestant=html.find('.pointrestant').val();
        var level=html.find('.niveau').val();
        var resultat=-20-((parseInt(level)-1)*10);
        var min=-20;
        for(i=0;i<26;i++){
            if(race=="Humain" && i==6){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }else if(race=="Arthuriens" && i==4){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }else if(race=="Alpha Draconiens" && i==9){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }else if(race=="Machine" && i==19){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }else if(race=="Pleiadiens" && i==20){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }else if(race=="Yoribiens" && i==17){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }else if(race=="Elfen" && i==0){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }else if(race=="Orquanien" && i==3){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }
            if(metier=="Artisans" && i==1){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }else if(metier=="Commerce" && i==16){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }else if(metier=="Colon" && i==23){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }else if(metier=="Intellectuel" && i==10){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }else if(metier=="Malandrins" && i==8){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }else if(metier=="Pilote" && i==18){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }else if(metier=="Médecin" && i==13){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }else if(metier=="Militaire" && i==24){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }else if(metier=="Mécanicien" && i==12){
                var controle= html.find('.cpt'+i).val();
                if(controle<min){
                    html.find('.cpt'+i).val(min);
                }
            }
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
        var hpmax=html.find('.hpmax').val();
        var pointhp=(parseInt(hpmax)-20)*2;
        resultat=resultat+pointhp;
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

        //generateur d'histoire
        html.find('.generator').on('click',function(){
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
            html.find('.histoire').val(textgen);
        });

        //caractere aléatoire
        html.find('.caractergen').on('click',function(){
            var demeure = ["Maison","Hotel","Chez un ami","demeure","Sous un pont","Sur un Bateau","Ferme","Auberge","Commerce / Négociation","Forge","Villa","Cabane"];
            var proximite=["sur une planète du secteur de","sur"];
            var lieu=["End-125","Proxima","Atarus","Sebos","ZX52","DX-128","ROF-89","HD-720P","Quenza","Sigma","TK86","Talouine","Turka","Rota","Imperator","Reset","Creab","87AB","TH5","R852","Natura","F10-X","Tella","Olympus","Iron","Zeus","Athena","Gaia","Apollon","Gallus","M-IP","Elysée","Grande nébuleuse","Tartare","Alexandrie","Maxima","74P-R","Centaurus","Nouvelle Terre","END-128","Terre","HAT-P1B","Valhala","Mystérious"]
            var resident = demeure[Math.floor(Math.random()*demeure.length)]+" "+proximite[Math.floor(Math.random()*proximite.length)]+" "+lieu[Math.floor(Math.random()*lieu.length)];
            html.find('.residence').val(resident);
            var titre=["de contrebandier","de commercant","de militaire","de colon","d'aventuriers","de pilote","d'artisan","de médecin","de mécanicien","d'intellectuel"];
            var sang = "Issue d'une famille "+titre[Math.floor(Math.random()*titre.length)];
            html.find('.sang').val(sang);       
            var rang=["Subordonné","Chef","Dirigeant","Membre","Adepte","Affilié","Cotisant","Participant","Soutien"]
            var organisation=["de l'empire","de la rébélion","de la pléide","de l'OMC","de la fédération","des fanatiques","du commité des pilotes","du commité des chasseurs","du comité des commerçants","du comité des voyageurs","du comité des philosophes","du comité des artistes","de la guilde des contrebandier","du comité des militaire","de la guilde des mercenaires","de la guilde des tueurs de monstres","de la bande de bandits","de la bande de pirates"]
            var politique=rang[Math.floor(Math.random()*rang.length)]+" "+organisation[Math.floor(Math.random()*organisation.length)];
            html.find('.secte').val(politique);
            var groupe=organisation[Math.floor(Math.random()*organisation.length)]
            html.find('.interet').val(groupe);
            var pertes=["mère","père","frère","soeur","ami(e)","amant(e)","personne","mentor","disciple","chef de son groupe","oncle","cousin","neveu","fiancé(e)","enfant","compagnon d'armes","rival(e)"]
            var dc=pertes[Math.floor(Math.random()*pertes.length)]
            html.find('.proche').val(dc);
            var valeur=["Aucun","Ethique","Verteux","Stoïcisme","Social","Humaniste","Questionnement","Droit","Juste","Corrompu","Egoiste","Individualiste","Communautaire"]
            var moral=valeur[Math.floor(Math.random()*valeur.length)]
            html.find('.moral').val(moral);
            var race=["Humain","Alpha Draconique","Pleiadiens","Arthuriens","Yoribiens","Elfen","Orquanien","Machine"]
            var rang=["subordonné","chef","dirigeant","membre","adepte","affilié","cotisant","participant","soutien"]
            var amour=race[Math.floor(Math.random()*race.length)]+" "+rang[Math.floor(Math.random()*rang.length)]+" "+organisation[Math.floor(Math.random()*organisation.length)];
            html.find('.amour').val(amour)
            var ami=race[Math.floor(Math.random()*race.length)]+" "+rang[Math.floor(Math.random()*rang.length)]+" "+organisation[Math.floor(Math.random()*organisation.length)];
            html.find('.amitie').val(ami);
            var haine=race[Math.floor(Math.random()*race.length)]+" "+rang[Math.floor(Math.random()*rang.length)]+" "+organisation[Math.floor(Math.random()*organisation.length)];
            html.find('.haine').val(haine);
            var profession=["Voleur","Pilote","Artisan","Assassin","Garde","Marchand","Artisan","Chasseur","Chasseur de prime","Contrebandier","Vagabon","Navigateur","Aubergiste","Charlatant","Artiste","Diplomate","Fonctionnaire","Livreur","Soldat","Mercenaire"]
            var metier=profession[Math.floor(Math.random()*profession.length)]
            html.find('.principale').val(metier);
            var metier=profession[Math.floor(Math.random()*profession.length)]
            html.find('.secondaire').val(metier);
            var loisir=["Chasse","Tricot","Crochet","Broderie","Peinture","Poésie","Chant","Acrobatie","Danse","Manger","Promenade","Peche","Equitation","Carte","Jeux d'argent","Coureur de jupon","Vol","Jardiner","Lecture","Dessin","Poterie"]
            var metier=loisir[Math.floor(Math.random()*loisir.length)]
            html.find('.passion').val(metier);
            var caracterelist=["Social","Individualiste","Altruiste","Fidéle","Infidel","Egoïsme","Générosité","Compassion","Fraternel","Dévoué","Croyant","Vaniteux","Forcené"]
            var caractere=caracterelist[Math.floor(Math.random()*caracterelist.length)]
            html.find('.caractere').val(caractere);
            var personnalitelist=["Compléxé(e)","Débrouillard","Assisté(e)","Maniaque","Bordelique","Patient","Impatient","Supersticieux","Rationnel","Emotif","Apathique","Flégmatique","Précieux","Bourru","Colérique","Sérieux","Mélancolique","Sanguin"]
            var personnalite=personnalitelist[Math.floor(Math.random()*personnalitelist.length)]
            html.find('.personnalite').val(personnalite);
            var visionlist=["barbare","danger","découverte","connaissance","richesse","impie","démon","coeur à prendre","monstre","gibier","mystère","bandit","secte","croyance"]
            var vision="Rempli de "+visionlist[Math.floor(Math.random()*visionlist.length)]
            html.find('.monde').val(vision);
            var objectiflist=["Devenir riche","Liberer de leur servitude","Aider sa communauté","Aider la nature","Recherche spirituel","Tuer les autres race","Recherche de connaissance"]
            var objectif=objectiflist[Math.floor(Math.random()*objectiflist.length)]
            html.find('.objectif').val(objectif);
            var racunelist=["oui","non","Dépend de la situation"]
            var racune=racunelist[Math.floor(Math.random()*racunelist.length)]
            html.find('.rancunier').val(racune);
            var tarelist=["Ablutophobie – Peur de se baigner. Cette phobie est plus une peur de la noyade qu'une peur de l'eau.","Acarophobie – Peur des parasites de la peau, des acariens.","Achluophobie – Peur de l'obscurité et du noir.","Achmophobie / Aichmophobie – Peur des aiguilles et des objets pointus (ciseaux, couteaux, seringues par exemple).","Acrophobie – Peur des hauteurs ; s'accompagne souvent de vertiges.","Administrativophobie – Peur des relations avec l'administration et des courriers administratifs.","Anasthesiaphobie - Peur de l'anesthésie.","Aérodromophobie – Peur de l'avion, des voyages en avion.","Aérophobie – Peur de l'air et du vent.","Agoraphobie – Peur des espaces publics et, par extension, de la foule ; plus généralement, des espaces où la fuite est rendue difficile (foule, mais aussi lieux déserts).","Algophobie – Peur de la douleur.","Alopophobie – Peur des chauves.","Amatophobie – Phobie de la poussière.","Amaxophobie – Peur de la conduite.","Anginophobie – Peur de l’étouffement, notamment par des angines de poitrine.","Angrophobie – Peur de se mettre en colère en public.","Ankylophobie – Peur de l'immobilité.","Anthelmophobie – Peur des vers.","Anthropophobie – Peur des gens ou d'être en leur compagnie, une forme de phobie sociale.","Anuptaphobie – Peur du célibat.","Apéirophobie – Peur de l'infini.","Apopathodiaphulatophobie – Peur d'être constipé ou de la constipation en elle-même.","Apopathophobie – Peur d'aller à la selle.","Aquaphobie – Peur de l’eau.","Arithmophobie – Peur des chiffres.","Asthénophobie – Peur de s'évanouir","Astraphobie – Peur du tonnerre.","Athazagoraphobie – Peur d'être oublié ou ignoré.","Atychiphobie – Peur de l’échec.","Automysophobie – Peur d'être sale, de sentir mauvais.","Autophobie – Peur de la solitude.","Aviophobie – Peur de prendre l'avion.","Bacillophobie – Peur des bacilles, des bactéries,.","Basophobie – Peur de marcher.","Bélénophobie – Peur des aiguilles (cf. achmophobie).","Blemmophobie – Peur du regard des autres.","Borbophobie – Peur des gargouillements.","Brontophobie – Peur du tonnerre.","Cancérophobie – Peur du cancer.","Cardiophobie – Peur du cœur ou peur d'un développement d'une maladie cardiovasculaire.","Carpophobie - Peur des fruits","Catapédaphobie – Peur de grimper en hauteur.","Cherophobie – Peur de la gaieté.","Chorophobie – Peur de danser.","Claustrophobie – Peur des espaces confinés.","Climacophobie – Peur d'utiliser des escaliers, surtout de les descendre.","Coemetiriophobie - Peur des cimetières.","Coulrophobie – Peur des clowns.","Cyclophobie – Peur de monter sur une bicyclette ou tout autre véhicule à deux roues.","Dentophobie – Peur du dentiste.","Dysmorphophobie / Dysmorphophie – Peur des anomalies physiques.","Ecclesiophobie – Peur des églises[réf. souhaitée].","Émétophobie – Peur de vomir.","Epistaxiophobie – Peur des saignements de nez.","Éreutophobie (ou l'érythrophobie)– Peur de rougir en public.","Fumiphobie – Peur de la fumée (tabac par exemple)","Géphyrophobie – Peur des ponts (ou de traverser les ponts).","Gérascophobie – Peur de vieillir.","Germophobie – Peur des germes.","Glossophobie – Peur de parler en public.","Graphophobie – Peur de l'écriture (fait d'écrire).","Gymnophobie – Peur de la nudité.","Halitophobie – Peur d'avoir mauvaise haleine.","Haptophobie (ou Aphenphosmophobie) – Peur d'être touché.","Hématophobie – Peur du contact et de la vue du sang.","Hylophobie – Peur des forêts.","Hypégiaphobie – Peur des responsabilités.","Ithyphallophobie / Medorthophobie – Peur de voir des pénis en érection.","Katagélophobie – Peur du ridicule.","Kénophobie – Peur de l'obscurité.","Kéraunophobie - Crainte morbide de la foudre et des orages.","Kopophobie – Peur d'être fatigué, ou de la fatigue elle-même.","Laxophobie – Peur d’être pris de diarrhées impérieuses en public, en dehors de chez soi, et de ne pas arriver à se retenir.","Leucosélophobie – Peur de la page blanche (blocage de l'écrivain) .","Lilapsophobie - Peur des tornades.","Maskaphobie – Peur des masques.","Mégalophobie – Peur des grands objets, des grands bâtiments (Gratte-ciel ou navires de croisière par exemple)","Musicophobie – Peur de la musique.","Mycophobie – Peur des champignons.","Mysophobie – Peur de la saleté, de la contamination par les microbes.","Nanopabulophobie – Peur des nains de jardin à brouette.","Nanophobie – Peur des nains.","Nécrophobie – Peur des cadavres.","Nélophobie – peur du verre (également Hyalophobie).","Néphobie – peur de l'inédit.","Néphrophobie – peur des maladie du rein (également Lithophobie).","Neurasthénophobie – peur de la tristesse.","Névrophobie – peur des crises de nerf (également Hystérophobie).","Nicophobie – peur des cigarettes.","Nomophobie – Peur d'être séparé de son téléphone portable. Cette phobie désignerait aussi la peur excessive des lois.","Nosocomephobie – Peur des hôpitaux, cliniques et centres de soin en général.","Nosophobie – Peur de la maladie, d'être malade.","Notaphobie – peur des factures (également Votaphobie).","Nourinophobie – peur des cochons (également Suidéphobie).","Nudophobie – peur ou réprobation de la nudité humaine.","Nulophobie – peur de la cité.","Numérophobie – peur des numéros.","Numismatophobie – peur des monnaies.","Ochlophobie – Peur de la foule.","Odontophobie – Peur du chirurgien-dentiste / des actes médicaux ou chirurgicaux en bouche.","Ombilicophobie - Peur du nombril, ne supporte pas d'y toucher ou de le voir","Paraskevidékatriaphobie – Peur des vendredis ","Pantophobie – Peur de tout","Pédiophobie – Peur des poupées","Pédophobie - Peur des enfants.","Phagophobie – Peur de s'étouffer avec des aliments.","Phasmophobie – Peur des fantômes.","Philophobie - Peur de tomber amoureux.","Philématophobie - Peur d'embrasser.","Protophiphouphobie - Peur de manquer de protéines ","Phobie de type sang-injection-blessure – Sous-type de phobies spécifiques classifié dans le DSM-IV.","Phobie sociale – Peur des ou de certaines situations sociales.","Phobophobie – Peur d'avoir peur (d'être surpris).","Pogonophobie – Aversion envers les barbes / phobie des poils du menton et des joues.","Podophobie – Peur des pieds","Psychopathophobie – Peur de devenir fou.","Pyrophobie – Peur du feu.","Scatophobie – Peur des excréments.","Scopophobie – Peur du regard des autres.","Sélénophobie – Peur de la lune.","Sidérodromophobie – Peur de voyager en train.","Spectrophobie – Peur des miroirs (des reflets).","Spitophobie - Peur de la salive","Stasophobie – Peur d'avoir à rester debout.","Taphophobie – Peur des tombes ou d'être enterré vivant.","Téléphonophobie – Peur de répondre au téléphone.","Tératophobie – Peur des monstres.","Thalassophobie – Peur de la mer.","Thanatophobie – Peur de la mort.","Théophobie – Peur de Dieu.","Tokophobie – Peur d'accoucher.","Trichophobie – Peur des poils et de la pilosité.","Trypophobie – Peur des trous.","Xénoglossophobie : Peur des langues étrangères.","Ailurophobie – Peur des chats.","Alektorophobie – Peur des poulets.","Anthelmophobie – Peur des vers.","Apiphobie – Peur des abeilles ; par extension, peur des insectes possédant un dard ou pouvant piquer.","Arachnophobie – Peur des araignées.","Chiroptophobie – Peur des chauves-souris","Cuniculophobie – Peur des lapins.","Cynophobie – Peur des chiens.","Entomophobie – Peur des insectes.","Héliciphobie - Peur des escargots et des limaces.","Herpétophobie – Peur des reptiles ou amphibiens.","Hippophobie – Peur des chevaux, des équidés.","Ichthyophobie – Peur des poissons.","Musophobie – Peur des souris ou rats.","Myrmécophobie – Peur des fourmis.","Octophobie- Peur des poulpes/pieuvres.","Ophiophobie – Peur des serpents.","Ornithophobie – Peur des oiseaux.","Squalophobie – Peur des requins."]
            var tare=tarelist[Math.floor(Math.random()*tarelist.length)]
            html.find('.tare').val(tare);
            var obsessionlist=["oui","non","Dépend de la situation"]
            var obsession=obsessionlist[Math.floor(Math.random()*obsessionlist.length)]
            html.find('.obsession').val(obsession);
            var distinguelist=["oui","non","Dépend de la situation"]
            var distingue=distinguelist[Math.floor(Math.random()*distinguelist.length)]
            html.find('.distingue').val(distingue);
        });

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

        html.find('.ancienete').on('click',function(){
            var texte=$(this).html();
            html.find('.model').val(texte);
        });

        /*Etat*/
        var etats=['inconsient','invisible','blesse','mort','empoisonné','prie','attache','fort','faible','concentre','brule','mordu','aucun']
        var actoretat=html.find('.etats').val();
        for (var i = 0; i <= 13; i++) {
            if(actoretat==etats[i]){
                html.find('.etat'+i).css("opacity", "1");
            }
        }
        $('.etat0').on('click',function(){
            $(this).parent().children("button").css({"opacity": "0.5"});
            //$(this).css("opacity", "1");
            $(this).parent().find(".etats").val('inconsient');
        });
        $('.etat1').on('click',function(){
            $(this).parent().children("button").css({"opacity": "0.5"});
            //$(this).css("opacity", "1");
            $(this).parent().find(".etats").val('invisible');
        });
        $('.etat2').on('click',function(){
            $(this).parent().children("button").css({"opacity": "0.5"});
            //$(this).css("opacity", "1");
            $(this).parent().find(".etats").val('blesse');
        });
        $('.etat3').on('click',function(){
            $(this).parent().children("button").css({"opacity": "0.5"});
            //$(this).css("opacity", "1");
            $(this).parent().find(".etats").val('mort');
        });
        $('.etat4').on('click',function(){
            $(this).parent().children("button").css({"opacity": "0.5"});
            //$(this).css("opacity", "1");
            $(this).parent().find(".etats").val('empoisonné');
        });
        $('.etat5').on('click',function(){
            $(this).parent().children("button").css({"opacity": "0.5"});
            //$(this).css("opacity", "1");
            $(this).parent().find(".etats").val('prie');
        });
        $('.etat6').on('click',function(){
            $(this).parent().children("button").css({"opacity": "0.5"});
            //$(this).css("opacity", "1");
            $(this).parent().find(".etats").val('attache');
        });
        $('.etat7').on('click',function(){
            $(this).parent().children("button").css({"opacity": "0.5"});
            //$(this).css("opacity", "1");
            $(this).parent().find(".etats").val('fort');
        });
        $('.etat8').on('click',function(){
            $(this).parent().children("button").css({"opacity": "0.5"});
            //$(this).css("opacity", "1");
            $(this).parent().find(".etats").val('faible');
        });
        $('.etat9').on('click',function(){
            $(this).parent().children("button").css({"opacity": "0.5"});
            //$(this).css("opacity", "1");
            $(this).parent().find(".etats").val('concentre');
        });
        $('.etat10').on('click',function(){
            $(this).parent().children("button").css({"opacity": "0.5"});
            //$(this).css("opacity", "1");
            $(this).parent().find(".etats").val('brule');
        });
        $('.etat11').on('click',function(){
            $(this).parent().children("button").css({"opacity": "0.5"});
            //$(this).css("opacity", "1");
            $(this).parent().find(".etats").val('mordu');
        });
        $('.etat12').on('click',function(){
            $(this).parent().children("button").css({"opacity": "0.5"});
            //$(this).css("opacity", "1");
            $(this).parent().find(".etats").val('aucun');
        });


        /*Poids encombrement*/
        var poids=[];
        var quantite=[];
        var total=0;
        html.find( ".item-poid" ).each(function( index ) {
          poids.push($( this ).text());
        });
        html.find( ".item-qt" ).each(function( index ) {
          quantite.push($( this ).text());
        });
        for (var i = 1;i < poids.length ; i++) {
           total=total+parseFloat(poids[i])*parseFloat(quantite[i]);
        }
        var enc=html.find('.enc').val();
        var enc=parseFloat(enc);
        var pourcentage= total*100/enc;

        if(pourcentage<50){
            html.find('.barenc').css({"background":'green'})
        }else if(pourcentage<75){
            html.find('.barenc').css({"background":'orange'})
        }else if(pourcentage<100){
            html.find('.barenc').css({"background":'red'})
        }else if(pourcentage<120){
            html.find('.barenc').css({"background":'#660000'})
        }else{
            html.find('.barenc').css({"background":'black'})
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

        /*Jet de des*/
        html.find('.jetdedes').click(this._onRoll.bind(this)); 
        html.find('.jetdedegat').click(this._onRoll2.bind(this)); 

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
        for (var i=0; i<4; i++) {
            var min=html.find(".min"+i).val();
            var max=html.find(".max"+i).val();
            var pou=parseInt(min)*100/parseInt(max);
            if(pou<20){
                var color='red';
            }else if(pou<60){
                var color='orange';
            }else{
                var color='blue';
            }
            html.find(".bar"+i).css({'width':pou+'%','background':color});
        }

        html.find( ".compt input" ).each(function() {
              var valor= $( this ).val();
              if(valor==0){
                $( this ).css({"background":"transparent","color": "#fff"});
              }else if(valor>0){
                $( this ).css({"background":"#56853b","color": "white"});
              }else if(valor<0){
                $( this ).css({"background":"#a51b1b","color": "white"});
              }
            });
            


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
        var arme ='';
        var chargequi='';
        const jetdeDesFormule = "1d100";
        var bonus =this.actor.data.data.malus;
        var critique=5;
        var conf="auto";
        if(bonus=='' || bonus ==undefined || bonus==null){
            bonus=0;
        }
        let inforesult=parseInt(maxstat)+parseInt(bonus)+30;
        if(inforesult>95){
            inforesult=95;
        }

        if(name=="Tir" || name=="Tircouv"){
            if(name=="Tir"){var conf="none;width: 200px;";}
            arme = event.target.dataset["armed"];
            chargequi=event.target.dataset["charged"];
            if(chargequi=='' || chargequi== undefined){
                 chargequi="Mun. "+arme
            }
            var chargeur=this.actor.data.items.filter(i=>i.name == chargequi); 
                 
            
            if(chargeur.length === 0){
                succes="<h4 class='resultat' style='background:#ff3333;'>Pas de chargeur !</h4>";
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: succes
                  });
                return;
            }
            var munition=chargeur[0].data.data.quantite;
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
        if(name=="Tircouv"){
            var arme = event.target.dataset["armed"];
            perte=10;
            if(retour>95){
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
            var arme = event.target.dataset["armed"];
            var degat = event.target.dataset["degat"];
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
                perte=1;                
            }else if(retour>critique){
                succes="<h4 class='resultat' style='background:#78be50;'>Dégât x1.5</h4>";
                degat=parseInt(degat)*1.5;
                deg='<h4 class="resultdeg">'+degat+'</h4>';
                perte=1;
            }else if(retour<=critique){
                succes="<h4 class='resultat' style='background:#78be50;'>Dégât x2</h4>";
                degat=parseInt(degat)*2;
                deg='<h4 class="resultdeg">'+degat+'</h4>';
                perte=1;                
            }       
        }else {
            if(retour>95){
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
            let itemData= this.actor.data.items.filter(i=>i.name == chargequi);                 
            var iditem= itemData[0].id;
            var qty = itemData[0].data.data.quantite;
            if(perte==10){
                itemData[0].NunsMoins();
            }else{
                itemData[0].MunMoins();
            }
        } 
        
    
        if(inforesult<=0){
            succes="<h4 class='resultat' style='background:#ff3333;'>Echec critique</h4>";
        }
        const texte = '<span style="flex:'+conf+'"><p style="text-align: center;font-size: medium;background: #6a7885;padding: 5px;color: white;">Jet de ' + name + " : " + jetdeDesFormule +" - " + inforesult + '</p>'+ succes+'</span>'+deg;
        //roll.roll().toMessage({
        roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: texte
        });
    }
    _onRoll2(event){

        let monJetDeDes = event.target.dataset["dice"];
        const name = event.target.dataset["name"];
        let r = new Roll(monJetDeDes);
        var roll=r.evaluate({"async": false});;
        const texte = "Utilise " + name + " : " + monJetDeDes;
        roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: texte
        });
    }
}