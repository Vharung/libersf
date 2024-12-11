import { liber } from "./class/config.js";
import { range } from "./class/list.js";
/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
 export class LiberActorSheet extends ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
          classes: ["Liber", "sheet", "actor"],
          width: 870,
          height: 870,
          dragDrop: [{dragSelector: ".draggable", dropSelector: null},{dragSelector: ".ability", dropSelector: null}],
          tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    get template() {
        if (this.actor.type == 'personnage' || this.actor.type == 'pnj' ) {
            return `systems/libersf/templates/sheets/personnage-sheet.hbs`;
        }else {
            return `systems/libersf/templates/sheets/${this.actor.type}-sheet.hbs`;
        }    
    }

    async getData(options) {
        // Récupération des données de la méthode parente
        const context = await super.getData(options);
        context.dtypes = ["String", "Number", "Boolean"];
        context.listValues = {
            race: range.raceTypes,
            sexe: range.sex,
            faction: range.factionTypes,
            metier: range.metierTypes,
            taille: range.tailleTypes,
            type: range.typeTypes,
            choix: range.choix,
            niveau: range.niveau,
            usage:range.usage,
            moteur:range.moteur,
            blindage:range.blindage,
            ia:range.ia,
            ia:range.ia,
            traduct: {},
            domination :null,
            niveau_arme :null,
            crime:null,
            niveau_secu :null,
            niveau_tech :null,
            bonusmetierlvl:{}               
        };        
        let faction=null;
        let metier = null;
        let type = null;
        let choix = null;
        let taille = null;
        let race = null;
        let sexe = null;
        let usage = null;
        let moteur = null;
        let blindage = null;
        let ia = null;
        let domination=null;
        let niveau_arme=null;
        let crime=null;
        let niveau_secu=null;
        let niveau_tech=null;
        let limited=context.limited;
        let owner=context.owner;
        let droit=null;
        let bonusmetierlvl={};
        if(limited==true && owner==false){
            droit='limite';//pilote
        }else if(limited==false && owner==false){
            droit='observateur';//mecano et artilleur
        }else if(limited==false && owner==true){
            droit='proprio';//commandant, navigateur
        } 
        // Récupérer les valeurs nécessaires depuis l'acteur
        if(this.actor.type == "vehicule"){
            faction = context.actor.system.model.faction || null;
            metier = context.actor.system.model.metier || null;
            type = context.actor.system.model.type.nb || null;
            choix = context.actor.system.model.choix || null;
            taille = context.actor.system.model.taille.nb || null;
            usage = context.actor.system.model.usage || null;
            moteur = context.actor.system.model.moteur || null;
            blindage = context.actor.system.model.blindage || null;
            ia = context.actor.system.model.ia || null;
            droit=context.actor.system.droit || droit;
        } else if (["personnage", "pnj", "monstre"].includes(this.actor.type)) {
            race = context.actor.system.background.race || null;
            faction = context.actor.system.background.religion || null;
            metier = context.actor.system.background.metier || null;
            type = context.actor.system.background.type || null;
            choix = context.actor.system.background.choix || null;
            taille = context.actor.system.background.taille || null;
            sexe = context.actor.system.background.sexe || null;
        }else if(this.actor.type == "planete"){
            domination = context.actor.system.domination || null;
            niveau_arme = context.actor.system.niveau_arme || null;
            crime = context.actor.system.crime || null;
            niveau_secu = context.actor.system.niveau_secu || null;
            niveau_tech = context.actor.system.niveau_tech || null;
        }

        let compet=null;
        if (["personnage", "pnj", "monstre", "vehicule"].includes(this.actor.type)) {
            compet=this._prepareCharacterItems(context);
            bonusmetierlvl= await this.competence(metier,compet)
            let stat= await this._onStatM(context);
            context.actor.system = {
                ...context.actor.system,
                attributs: {
                    ...context.actor.system.attributs,
                    Agilité: stat['system.attributs.Agilité'],
                    Artisanat: stat['system.attributs.Artisanat'],
                    Balistique: stat['system.attributs.Balistique'],
                    Combat: stat['system.attributs.Combat'],
                    ConGén: stat['system.attributs.ConGén'],
                    ConSpécif: stat['system.attributs.ConSpécif'],
                    Dextérité: stat['system.attributs.Dextérité'],
                    Diplomatie: stat['system.attributs.Diplomatie'],
                    Discrétion: stat['system.attributs.Discrétion'],
                    Force: stat['system.attributs.Force'],
                    Investigation: stat['system.attributs.Investigation'],
                    Jeu: stat['system.attributs.Jeu'],
                    Mécanique: stat['system.attributs.Mécanique'],
                    Médecine: stat['system.attributs.Médecine'],
                    Natation: stat['system.attributs.Natation'],
                    Navigation: stat['system.attributs.Navigation'],
                    Négociation: stat['system.attributs.Négociation'],
                    Perception: stat['system.attributs.Perception'],
                    Pilotage: stat['system.attributs.Pilotage'],
                    Piratage: stat['system.attributs.Piratage'],
                    Pistage: stat['system.attributs.Pistage'],
                    Religion: stat['system.attributs.Religion'],
                    Science: stat['system.attributs.Science'],
                    Survie: stat['system.attributs.Survie'],
                    Tir: stat['system.attributs.Tir'],
                    Visée: stat['system.attributs.Visée'],
                    magie: stat['system.attributs.magie'],
                },
                background: {
                    ...context.actor.system.background,
                    etat: {
                        ...context.actor.system.background.etat,
                        a: stat['system.background.etat.a'],
                        b: stat['system.background.etat.b'],
                        c: stat['system.background.etat.c'],
                        d: stat['system.background.etat.d'],
                        e: stat['system.background.etat.e'],
                        f: stat['system.background.etat.f'],
                        g: stat['system.background.etat.g'],
                        h: stat['system.background.etat.h'],
                        i: stat['system.background.etat.i'],
                        j: stat['system.background.etat.j'],
                        k: stat['system.background.etat.k'],
                        l: stat['system.background.etat.l'],
                        m: stat['system.background.etat.m'],
                        n: stat['system.background.etat.n']
                    }
                }
            };
            
        }
        if (["personnage", "pnj", "monstre"].includes(this.actor.type)) {
            this._onEncom(context);  
        }
        if(this.actor.type == "vehicule"){
            let stat= await this._onStatV(context);
            context.actor.system = {
                ...context.actor.system,
                droit:droit,
                stat: {
                    ...context.actor.system.stat,
                    moteur: {
                        ...context.actor.system.stat.moteur,
                        value: stat['system.stat.moteur.value'],
                        max: stat['system.stat.moteur.max']
                    },
                    encombrement: {
                        ...context.actor.system.stat.encombrement,
                        value: stat['system.stat.encombrement.value'],
                        max: stat['system.stat.encombrement.max']
                    },
                    pointrestant: stat['system.stat.pointrestant'],
                    protections: {
                        ...context.actor.system.stat.protections,
                        max: stat['system.stat.protections.max']
                    },
                    armure: {
                        ...context.actor.system.stat.armure,
                        max: stat['system.stat.armure.max']
                    },
                    credit: stat['system.stat.credit']
                },
                model: {
                    ...context.actor.system.model,
                    point: {
                        ...context.actor.system.model.point,
                        piece: stat['system.model.point.piece'],
                        arme: stat['system.model.point.arme']
                    },
                    technologie: stat['system.model.tehnologie'],
                    type: {
                        ...context.actor.system.model.type,
                        etoile: stat['system.model.type.etoile']
                    },
                    taille: {
                        ...context.actor.system.model.taille,
                        etoile: stat['system.model.taille.etoile']
                    },
                    moteur: {
                        ...context.actor.system.model.moteur,
                        etoile: stat['system.model.moteur.etoile']
                    },
                    pilotage: stat['system.model.pilotage'],
                    piratage: stat['system.model.piratage'],
                    vise: stat['system.model.vise']
                },
                back: {
                    ...context.actor.system.back,
                    danger: stat['system.back.danger'],
                    vaisseau: stat['system.back.vaisseau']
                }
            };
        }
        context.listValues.bonusmetierlvl = bonusmetierlvl;
        context.listValues.traduct = {
            race: context.listValues.race[race] ? game.i18n.localize(context.listValues.race[race].label) : '',
            sexe: context.listValues.sexe[sexe] ? game.i18n.localize(context.listValues.sexe[sexe].label) : '',
            faction: context.listValues.faction[faction] ? game.i18n.localize(context.listValues.faction[faction].label) : '',
            metier: metier && context.listValues.metier[metier] ? game.i18n.localize(context.listValues.metier[metier].label) : '',
            religion: context.actor.system.religion && context.listValues.religion && context.listValues.religion[context.actor.system.religion]
                ? game.i18n.localize(context.listValues.religion[context.actor.system.religion].label) : '',
            type: type && context.listValues.type[type] ? game.i18n.localize(context.listValues.type[type].label) : '',
            choix: choix && context.listValues.choix[choix] ? game.i18n.localize(context.listValues.choix[choix].label) : '',
            taille: taille && context.listValues.taille[taille] ? game.i18n.localize(context.listValues.taille[taille].label) : '',
            moteur: moteur && context.listValues.moteur[moteur] ? game.i18n.localize(context.listValues.moteur[moteur].label) : ''
        };
        console.log(context)
        
        return context;
    }

   
    _prepareCharacterItems(sheetData) {
       const actorData = sheetData.actor;
        // Initialize containers.
        const inventaire = [];
        const arme = [];
        const varme = [];
        const armure = [];
        const piece = [];
        const argent = [];
        const level=[]
        
        // Iterate through items, allocating to containers
        // let totalWeight = 0;
        for (let i of sheetData.items) {
          let item = i.items;
          i.img = i.img || DEFAULT_TOKEN;
          if (i.type === "arme") {
            arme.push(i);
          }else if (i.type === "arme-véhicule") {
            varme.push(i);
          }else if (i.type === "armure") {
            armure.push(i);
          }
          else if (i.type === "bouclier") {
            armure.push(i);
          }
          else if (i.type === "objet") {
            inventaire.push(i);
          }
          else if (i.type === "piece") {
            piece.push(i);
          }
          else if (i.type === "argent") {
            argent.push(i);
          }
          else if (i.type === "level") {
            level.push(i);
          }
        }
        inventaire.sort(function (a, b) {if (a.name < b.name) {return -1;} else {return 1;}});
        arme.sort(function (a, b) {if (a.name < b.name) {return -1;} else {return 1;}});
        varme.sort(function (a, b) {if (a.name < b.name) {return -1;} else {return 1;}});
        piece.sort(function (a, b) {if (a.name < b.name) {return -1;} else {return 1;}});
        armure.sort(function (a, b) {if (a.name < b.name) {return -1;} else {return 1;}});
        // Assign and return
        actorData.inventaire = inventaire;
        actorData.arme = arme;
        actorData.varme = varme;
        actorData.piece = piece;
        actorData.armure = armure;
        actorData.argent = argent;
        actorData.level = level;
        return level;
    }


    activateListeners(html){
        super.activateListeners(html);

        /*Jet de des*/
        html.find('.jetdedes').click(this._onRoll.bind(this)); 
        html.find('.item-equip').click(this._onArmor.bind(this));
        html.find('.desequi').click(this._onDesArmor.bind(this));
        html.find('.update').click(this._onNivArmor.bind(this))
        //choix Race
        html.find('.validation').click(this._onAvantageRace.bind(this));
        //caractere aléatoire
        html.find('.genererp').click(this._onEarth.bind(this));
        html.find('.aleatoire').click(this._onAleatoire.bind(this));
        /*Etat*/
        html.find('.action6').click(this._onCouv.bind(this));
        html.find('.chnget').click(this._onCouv.bind(this));
        html.find('.vehichoix').click(() => {
            this._onStatV();
            this._newV();
        });
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
        html.find('.item-create').click(ev => {
            event.preventDefault();
            const dataType=$(ev.currentTarget).data('type');
            const name = `New ${dataType.capitalize()}`;
            this.actor.createEmbeddedDocuments('Item', [{ name: name, type: dataType }], { renderSheet: true })
        });

        //niveau d'arme accéssible
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
        html.find('.armetoile').html('(max '+armetoile+' )')
        
        //calcule compétence
        let resultat
        var clanliste=html.find('.raceliste').val();
        var metierliste=html.find('.metierliste').val();
        var metier=html.find('.metier').val();
        var race=html.find('.race').val();
        var ptrestant=html.find('.pointrestant').val();
        var level=html.find('.niveau').val();
        if(this.actor.type=="vehicule"){
            var ptrestant2=this.actor.system.stat.pointrestant;
            resultat=parseInt(ptrestant2);

        }else {
            resultat=-40-((parseInt(level)-1)*10); 
        }
        for(i=0;i<26;i++){
            var valor=parseInt(html.find('.cpt'+i).val());
            resultat=resultat+valor;
        }
        /*$( ".compt input" ).each(function( index ) {
          var valor= $( this ).val();
          if(valor==0){
            $( this ).css({"background":"transparent","color": "#050a10"});
          }else if(valor>0){
            $( this ).css({"background":"#56853b","color": "#fff"});
          }else if(valor<0){
            $( this ).css({"background":"#a51b1b","color": "#fff"});
          }
        });*/

        //ajout de compétence
        html.find('.choixcpt').click(this._ajoutcompt.bind(this));

        if(level==undefined){
            resultat=resultat;
        }else if(this.actor.type!="vehicule"){
            var hpmax=html.find('.hpmax').val();
            var pointhp=(parseInt(hpmax)-20)*2;
            resultat=resultat+pointhp; 
        }   
        if(isNaN(resultat)){resultat='A Config';}
        html.find('.pointrestant').val(resultat); 
        /*competence specifique */
        let nomcomp=this.actor.system.nomcomp;
        if(nomcomp!=''){
            html.find('.compt5 a').html(nomcomp);
        }
        if(this.actor.system.background.race=='r8'){
            html.find('textarea.bonusrace').removeAttr('readonly');
        }
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

        /*Ancienté*/ // bug ??
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

        //+1 action si dext et agilité >30
        var agi=html.find('.cpt0').val();
        var dex=html.find('.cpt6').val();
        if(agi >=30 && dex >=30){
           // html.find('.titreaction').html(game.i18n.localize("libersf.action2"))
        }

        //couleur bar
        if(this.actor.type!="vehicule"){
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
              if(pc>'90'){
                $('.zone.'+name+' .bar').css({'background':'#00abab','width':pc+'%'});
                $('.z'+z).css({'background':'transparent'});                
              }else if(pc>'60'){
                $('.zone.'+name+' .bar').css({'background':'#c9984b','width':pc+'%'});
                $('.z'+z).css({'background':'#ccff003b'});
              }else if(pc>'30'){
                $('.zone.'+name+' .bar').css({'background':'#460000','width':pc+'%'});
                $('.z'+z).css({'background':'#ffa5003b'});
              }else if(pc>'0'){
                $('.zone.'+name+' .bar').css({'background':'#a10001','width':pc+'%'});
                $('.z'+z).css({'background':'#ff00003b'});
              }else{
                $('.z'+z).css({'background':'#000000cf'});
              }
            });
            /*Poids encombrement*/
            var exo=html.find('.armurequi').val()
            var poids=[];
            var quantite=[];
            var valeur=[];
            var total=0;var crinv=0;
            html.find( ".item-valeurs" ).each(function( index ) {
              valeur.push($( this ).text());
            });
            html.find( ".item-poid" ).each(function( index ) {
              poids.push($( this ).text());
            });
            html.find( ".item-qty" ).each(function( index ) {
              quantite.push($( this ).text());
            });

            for (var i = 0;i < poids.length ; i++) {
               total=parseInt(total)+(parseFloat(poids[i])*parseFloat(quantite[i]));
               crinv=parseInt(crinv)+(parseFloat(valeur[i])*parseFloat(quantite[i]));
            }
            if(exo=="Exosquelette"){
                enc=enc-10;
                enc=enc*2;
            }
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
            total=Math.round(total)
            html.find('.encours').val(total);
            html.find('.crinv').val(crinv);
            html.find('.barenc').css({"width":pourcentage+"%"});


            const items = html.find('ul.level li');
            const listcpt = [];

            // Extraire les données des éléments HTML
            items.each(function(index, item) {
                const $item = $(item);
                const name = $item.data('name');
                const prerequi = $item.data('prerequi');
                const description = $item.attr('title');
                const style = $item.attr('style');
                const id = $item.data('item-id');
                listcpt.push({
                    'name': name,
                    'prerequi': prerequi,
                    'description': description,
                    'style':style,
                    'id':id
                });
            });

            // Créer un objet pour stocker les compétences par nom pour une recherche rapide
            const inverted = {};

            // Inverser la structure des données
            listcpt.forEach(cpt => {
                inverted[cpt.name] = { ...cpt, subItems: [] };
            });

            // Construire l'arborescence en utilisant les prérequis
            const arbo = {};

            // Ajouter chaque compétence à son prérequis correspondant
            listcpt.forEach(cpt => {
                const { name, prerequi } = cpt;

                // Si le prérequis est défini, l'ajouter à la structure arborescente
                if (prerequi) {
                    if (!inverted[prerequi]) {
                        inverted[prerequi] = { subItems: [] };
                    }
                    inverted[prerequi].subItems.push(inverted[name]);
                } else {
                    // Sinon, ajouter la compétence directement à la racine de l'arborescence
                    arbo[name] = inverted[name];
                }
            });

            // Fonction pour générer le HTML récursivement
            function generateHTML(node) {
            let html2 = `<li class="item rexrow compte"><span title="${node.description}" style="${node.style}" data-item-id="${node.id}"></span>`;
            
            if (node.subItems.length > 0) {
                html2 += '<ul>';
                node.subItems.forEach(subItem => {
                html2 += generateHTML(subItem);
                });
                html2 += '</ul>';
            }

            html2 += '</li>';
            return html2;
            }

            // Créer le HTML pour l'arborescence
            function createTreeHTML(data) {
            let html2 = '<ul>';
            
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                html2 += generateHTML(data[key]);
                }
            }
            
            html2 += '</ul>';
            
            return html2;
            }

            // Insérer le HTML dans un élément de la page
            let container2 = createTreeHTML(arbo); // Utilisez 'arbo' ici
            html.find('.colonnecpt').html(container2)           
        }else if(this.actor.type=="vehicule"){
            let type=this.actor.system.type;
            let tail=this.actor.system.taille;
            let encour=html.find('.encours').val();
            let moteur=html.find('.motor').val();
            let moteurmax=html.find('.moteurmax').val();
            let nrj=html.find('.enc').val();
            let prixbase=this.actor.system.stat.credit;
            
            html.find('.listaction div').click(this._onNrj.bind(this));
            
            let pourcentage= encour*100/nrj;
       
            if(pourcentage<25){
                html.find('.barenc').css({"background":'#c92626'})
            }else if(pourcentage<50){
                html.find('.barenc').css({"background":'#c99326'})
            }else if(pourcentage<75){
                html.find('.barenc').css({"background":'#c9c726'})
            }else if(pourcentage<=100){
               html.find('.barenc').css({"background":'#41c926'})
            }
            if(pourcentage>100){
                pourcentage=100;
            }
            html.find('.barenc').css({"width":pourcentage+"%"});
            html.find('.enc').val(nrj);

            let pourcent= moteur*100/moteurmax;
       
            if(pourcent<25){
                html.find('.barmoteur').css({"background":'#c92626'})
            }else if(pourcent<50){
                html.find('.barmoteur').css({"background":'#c99326'})
            }else if(pourcent<75){
                html.find('.barmoteur').css({"background":'#c9c726'})
            }else if(pourcent<=100){
               html.find('.barmoteur').css({"background":'#41c926'})
            }
            if(pourcent>100){
                pourcent=100;
            }
            html.find('.barmoteur').css({"width":pourcent+"%"});
            
            
            let prix=[];
            let quantite=[];
            html.find( ".item-valeur" ).each(function( index ) {
                if($( this ).text()!=game.i18n.localize('libersf.l4')){
                    prix.push($( this ).text());
                }
                
            });
            html.find( ".item-qty" ).each(function( index ) {
                if($( this ).text()!=game.i18n.localize('libersf.l6')){
                    quantite.push($( this ).text());
                }
            });

            for (var i = 0;i < prix.length ; i++) {
               prixbase=parseFloat(prixbase)+parseFloat(prix[i])*parseFloat(quantite[i]);
            }
            html.find('.credit').val(prixbase);
            let proue = parseFloat(this.actor.system.bouclier.proue.value);
            let babord = parseFloat(this.actor.system.bouclier.babord.value);
            let tribord = parseFloat(this.actor.system.bouclier.tribord.value);
            let poupe = parseFloat(this.actor.system.bouclier.poupe.value);
            let bouc = parseFloat(this.actor.system.stat.protections.value);

            let boucmax = parseFloat(this.actor.system.stat.protections.max);
            let prouemax = parseFloat(this.actor.system.bouclier.proue.max);
            let babordmax = parseFloat(this.actor.system.bouclier.babord.max);
            let tribordmax = parseFloat(this.actor.system.bouclier.tribord.max);
            let poupemax = parseFloat(this.actor.system.bouclier.poupe.max);

            let dif = boucmax - (prouemax + babordmax + tribordmax + poupemax);

            const zone=[proue,tribord,poupe,babord];
            const zonename=['proue','tribord','poupe','babord'];
            const zonemax=[prouemax,tribordmax,poupemax,babordmax];
            for (let i = 0; i < zone.length; i++) {
                if (zone[i] > zonemax[i]) {
                    zone[i] = zonemax[i];
                    let updateData = {};
                    updateData[`system.bouclier.${zonename[i]}.value`] = zonemax[i];
                    this.actor.update(updateData);
                }
            }
            let totalzone=parseInt(proue)+parseInt(babord)+parseInt(tribord)+parseInt(poupe);
            html.find(".actbou").val(totalzone)
            if(dif<0){
                html.find('.refbarmax').css({'color':'red'});
            }else if(dif>0){
                html.find('.refbarmax').css({'color':'green'});
            }else{
                html.find('.refbarmax').css({'color':'#b1feff'});
            }
            for (var i = zone.length - 1; i >= 0; i--) {
                let pc=zone[i]*100/zonemax[i]
                let border = '';
                if (zonename[i] == 'proue') { border = 'top'; }
                if (zonename[i] == 'babord') { border = 'left'; }
                if (zonename[i] == 'tribord') { border = 'right'; }
                if (zonename[i] == 'poupe') { border = 'bottom'; }

                let cssProperty = 'border-' + border;
                if (pc < 30) {
                    $('input.refbar[data-zone="' + zonename[i] + '"]').css({'color': '#a10001'});    
                    $('.vehicule').css({[cssProperty]: '#a10001 solid 5px'}); // rouge
                } else if (pc < 60) {
                    $('input.refbar[data-zone="' + zonename[i] + '"]').css({'color': '#c9984b'});
                    $('.vehicule').css({[cssProperty]: '#c9984b solid 5px'}); // orange
                } else if (pc < 90) {
                    $('input.refbar[data-zone="' + zonename[i] + '"]').css({'color': '#00ab28'});
                    $('.vehicule').css({[cssProperty]: '#00ab28 solid 5px'}); // couleur 3
                } else {
                    $('input.refbar[data-zone="' + zonename[i] + '"]').css({'color': '#00abab'});
                    $('.vehicule').css({[cssProperty]: '#00abab solid 5px'}); // couleur 4
                }   
            }

            //affichage selon les droits
            let droit=this.actor.system.droit;
            if(droit=='limite'){
                html.find('.mecano').css({'display':'none'});//pilote
            }else if(droit=='observateur'){
                //mecano et artilleur
            }else if(droit=='proprio'){
                //commandant, navigateur
            } 

            let nbarme=-1;
            html.find( ".canon .item-qty" ).each(function( index ) {
                nbarme=nbarme + parseInt($( this ).text());          
            });
            html.find(".nbarme").text(nbarme)
            let nbpiece=0;
            html.find( ".pieces .item-qty" ).each(function( index ) {
                nbpiece=nbpiece + parseInt($( this ).text());          
            });
            html.find(".nbpiece").text(nbpiece)
        }      
        /*mise en forme credit*/
        if(this.actor.type!=="planete" && this.actor.type !=="monstre"){
           let credit= html.find(".credit").val();
            credit = credit.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            html.find(".credit").val(credit); 
        }
        
        
        /*Ajout Bonus*/
        $('.attribut').on('click',function(){
            var bonusactor=$(this).attr('name');
            html.find(".bonusactor").val(bonusactor);            
        });

        /*Reset Bonus*/
        $('.resetbonus').on('click',function(){
            html.find(".bonusactor").val('0');            
        });

        var andro=html.find('.andomedes').val();        
        if(andro=='o'){
            html.find(".andromede").css({'display':'block'});
            html.find(".compt27").css({'display':'block'});
        }else{
            html.find(".andromede").css({'display':'none'});
            html.find(".compt27").css({'display':'none'});
        }

        html.find( ".compt input" ).each(function() {
              var valor= $( this ).val();
              valor = Math.round(valor / 5) * 5;

              if(valor!=$(this).val()){
                $( this ).val(valor);
              }
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
        
        if (hp <= 0) {
            // Appliquer le style CSS pour le fond lorsque les points de vie sont égaux à 0
            $('#LiberActorSheet-Actor-'+this.actor._id+' .window-content').css('background', 'linear-gradient(230deg, rgba(190,25,25,1) 0%, rgba(25,25,25,1) 100%)');
        }else if(mut=="o"){
            $('#LiberActorSheet-Actor-'+this.actor._id+' .window-content').css({"background": 'linear-gradient(230deg, rgba(64,108,56,1) 0%, rgba(21,22,21,1) 100%)'});
        } else {
            // Réinitialiser les styles CSS lorsque les points de vie sont supérieurs à 0
             $('#LiberActorSheet-Actor-'+this.actor._id+' .window-content').css('background', 'linear-gradient(218deg, #2a2b2c 0%, #120304 100%)');
        }
        
    }


    getItemFromEvent = (ev) => {
        const parent = $(ev.currentTarget).parents(".item");
        return this.actor.items.get(parent.data("itemId"));
    }

    _onItemEdit(event){
        console.log('itemedit')
        const item = this.getItemFromEvent(event);
        item.sheet.render(true);
    }

    async _onRoll(event){
        let maxstat = event.target.dataset["attdice"];
        if(!maxstat){maxstat=this.actor.system.attributs.Tir}
        let name = event.target.dataset["name"];
        let type = this.actor.system.typed;
        let arme = this.actor.system.armed;
        let chargequi = this.actor.system.charged;
        let degat = this.actor.system.degatd;
        let etoiled = this.actor.system.etoiled;
        let race = this.actor.system.background.race;
        let mutant = this.actor.system.mutation;

        let balistique=this.actor.system.attributs.Balistique;
        let Mécanique=this.actor.system.attributs.Mécanique;
        let Artisanat=this.actor.system.attributs.Artisanat;
        let Balistique=this.actor.system.attributs.Balistique;
        let Pilotage=this.actor.system.attributs.Pilotage;
        let Piratage=this.actor.system.attributs.Piratage;

        
        let solit=this.actor.system.stat.solit;
        let escou=this.actor.system.stat.escouade;
        let critique=5+(parseInt(solit)*5);
        let echec=95-(parseInt(escou)*5);

        console.log(Pilotage)
        const jetdeDesFormule = "1d100";
        let bonus =this.actor.system.stat.bonus;
        if(bonus==""){bonus=0};
        let malus =this.actor.system.malus;
        if (["Artisanat", "Balistique", "Mécanique", "Pilotage", "Piratage"].includes(name) && ["personnage", "pnj"].includes(this.actor.type)) {
            let etoiles = await this._onMeca(event);
            let meca = parseInt(maxstat) - (parseInt(etoiles) * 5);
            if (meca > 0) { meca = 0; }
            bonus = parseInt(bonus) + parseInt(meca);
        }
        if(type=="C" && name=="Tir"){
            critique=critique+5;
        }
        if(type=="P" && name=="Tir"){
            echec=echec-5;
        }
        console.log(echec)
        console.log(critique)
        
        let conf="auto";
        if(bonus=='' || bonus ==undefined || bonus==null){
            bonus=0;
        }
        if(malus=='' || malus ==undefined || malus==null){
            malus=0;
        }
        let inforesult=parseInt(maxstat)+parseInt(bonus)+parseInt(malus)+30;
        if(inforesult>echec){
            inforesult=echec;
        }
        console.log(maxstat+'+'+bonus+"+"+malus+'+30 ')
        let etoilemax = 0
        if(name=="Tir"){
            etoilemax=Math.floor(parseInt(balistique)/5)+2;
        }else if(name=="Mécanique"){
            etoilemax=Math.floor(parseInt(Mécanique)/5)+2;
        }else if(name=="Artisanat"){
            etoilemax=Math.floor(parseInt(Artisanat)/5)+2;
        }else if(name=="Balistique"){
            etoilemax=Math.floor(parseInt(Balistique)/5)+2;
        }else if(name=="Pilotage"){
            etoilemax=Math.floor(parseInt(Pilotage)/5)+2;
        }else if(name=="Piratage"){
            etoilemax=Math.floor(parseInt(Piratage)/5)+2;
        }
        console.log(etoilemax )
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
        if(race=="Elfen"){
            etoilemax=parseInt(etoilemax)+2
        }
        let dif=parseInt(etoilemax)-parseInt(etoile);
        if(dif>0){dif=0;}
        if(name=="Tir" || name=="Tircouv"){

            inforesult=parseInt(inforesult)+(dif*5)
            if(name=="Tir"){conf="none;width: 200px;display:inline-block";}
            if(chargequi=='' || chargequi== undefined){
                 chargequi="Mun. "+arme
            }
            var chargeur=this.actor.items.filter(i=>i.name == chargequi); 
                 
            
            if(chargeur.length === 0){
                succes="<h4 class='resultat' style='background:#ff3333;'>"+game.i18n.localize('libersf.nocharger')+"</h4>";
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor: this }),
                    flavor: succes
                  });
                return;
            }
            var munition=chargeur[0].system.quantite;
            if(munition<=0 || name=="Tircouv" && munition<=10 ){   
                succes="<h4 class='resultat' style='background:#ff3333;'>"+game.i18n.localize('libersf.nomun')+"</h4>";
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor: this }),
                    flavor: succes
                  });
                return;
            } 
        }
        let avantage="";
        let invonven="";
        if(mutant=='o'){
            if(race=='r0'){
            avantage="<h2 style='text-align:center'>"+game.i18n.localize('libersf.muta')+"</h2><p>"+game.i18n.localize('libersf.J1')+"</p>";
            invonven="<h2 style='text-align:center'>"+game.i18n.localize('libersf.muta')+"</h2><p>"+game.i18n.localize('libersf.J2')+"</p>";
            }
            else if(race=='r1'){
                avantage="<h2 style='text-align:center'>"+game.i18n.localize('libersf.muta')+"</h2><p>"+game.i18n.localize('libersf.J3')+"</p>";
                invonven="<h2 style='text-align:center'>"+game.i18n.localize('libersf.muta')+"</h2><p>"+game.i18n.localize('libersf.J4')+"</p>";
            }
            else if(race=='r2'){
                avantage="<h2 style='text-align:center'>"+game.i18n.localize('libersf.muta')+"</h2><p>"+game.i18n.localize('libersf.J5')+"</p>";
                invonven="<h2 style='text-align:center'>"+game.i18n.localize('libersf.muta')+"</h2><p>"+game.i18n.localize('libersf.J6')+"</p>";
            }
            else if(race=='r3'){
                avantage="<h2 style='text-align:center'>"+game.i18n.localize('libersf.muta')+"</h2><p>"+game.i18n.localize('libersf.J7')+"</p>";
                invonven="<h2 style='text-align:center'>"+game.i18n.localize('libersf.muta')+"</h2><p>"+game.i18n.localize('libersf.J8')+"</p>";
            }
            else if(race=='r4'){
                avantage="<h2 style='text-align:center'>"+game.i18n.localize('libersf.muta')+"</h2><p>"+game.i18n.localize('libersf.J9')+""
                invonven="<h2 style='text-align:center'>"+game.i18n.localize('libersf.muta')+"</h2><p>"+game.i18n.localize('libersf.J10')+"</p>";
            }
            else if(race=='r5'){
                avantage="<h2 style='text-align:center'>"+game.i18n.localize('libersf.muta')+"</h2><p>"+game.i18n.localize('libersf.J11')+"</p>";
                invonven="<h2 style='text-align:center'>"+game.i18n.localize('libersf.muta')+"</h2><p>"+game.i18n.localize('libersf.J12')+"</p>";
            }
            else if(race=='r6'){
                avantage="<h2 style='text-align:center'>"+game.i18n.localize('libersf.muta')+"</h2><p>"+game.i18n.localize('libersf.J13')+"</p>";
                invonven="<h2 style='text-align:center'>"+game.i18n.localize('libersf.muta')+"</h2><p>"+game.i18n.localize('libersf.J14')+"</p>";
            }
            else if(race=='r7'){
                avantage="<h2 style='text-align:center'>"+game.i18n.localize('libersf.muta')+"</h2><p>"+game.i18n.localize('libersf.J15')+"</p>";
                invonven="<h2 style='text-align:center'>"+game.i18n.localize('libersf.muta')+"</h2><p>"+game.i18n.localize('libersf.J16')+"</p>";
            }
        }
        let r = await new Roll('1d100').evaluate();
        let retour = r.result;
        var deg='';
        var perte=0;
        var infoarme='';
        if(name=="Tir"){
            let typetir =await this._choixtir(event);
            console.log(typetir)
            if(typetir=="As"){
                perte=1;
                infoarme='<br><span class="infotir">Etourdi l’ennemi</span>';
            }else if(typetir=="A"){
                perte=10;
                inforesult=inforesult-10;
                infoarme='<br><span class="infotir">Ajout 10 de dégât, -10% en précision, –10 balles</span>';
            }else if(typetir=="C"){
                perte=1;
                infoarme='<br><span class="infotir">Les munitions indique le nombre de tours que cela peut être maintenu</span>';
            }else if(typetir=="CC"){
                perte=1;
                infoarme='<br><span class="infotir">Tire une balle par balle.</span>';
            }else if(typetir=="D"){
                perte=1;
                infoarme='<br><span class="infotir">Tir en cône, peut toucher plusieurs cibles dans ce cône.</span>';
            }else if(typetir=="L"){
                perte=1;
                infoarme='<br><span class="infotir">Pas de réduction de dommage contre les véhicules</span>';
            }else if(typetir=="H"){
                perte=1;
                infoarme='<br><span class="infotir">Ceci permet de tirer depuis une zone située à l’extérieur de la map.</span>';
            }else if(typetir=="R"){
                inforesult=inforesult-5;
                perte=3;
                infoarme='<br><span class="infotir">Ajout 5 de dégât, -5% en précision, –3 balles</span>';
            }
        }
        var succes="";
        if(name=="Visée"){
            if(retour>echec){
                succes="<h4 class='resultat' style='background:#ff3333;'>"+game.i18n.localize('libersf.J17')+"</h4>";
            }else if(retour>(inforesult+20)){
                succes="<h4 class='resultat' style='background:#ff5733;'>"+game.i18n.localize('libersf.J18')+"</h4>";
            }else if(retour>inforesult){
                succes="<h4 class='resultat' style='background:#ff5733;'>"+game.i18n.localize('libersf.J19')+"</h4>";
            }else if(retour>(inforesult-20)){
                succes="<h4 class='resultat' style='background:#78be50;'>"+game.i18n.localize('libersf.J20')+"</h4>";
            }else if(retour>critique){
                succes="<h4 class='resultat' style='background:#78be50;'>"+game.i18n.localize('libersf.J21')+"</h4>";
            }else if(retour<=critique){
                succes="<h4 class='resultat' style='background:#78be50;'>"+game.i18n.localize('libersf.J22')+"</h4>";
            }
        }else if(name=="Tircouv"){
            perte=10;
            if(retour>echec){
                succes="<h4 class='resultat' style='background:#ff3333;'>"+game.i18n.localize('libersf.J23')+"</h4>";
            }else if(retour>(inforesult+20)){
                succes="<h4 class='resultat' style='background:#ff5733;'>"+game.i18n.localize('libersf.J24')+"</h4>";
            }else if(retour>inforesult){
                succes="<h4 class='resultat' style='background:#ff5733;'>"+game.i18n.localize('libersf.J25')+"</h4>";
            }else if(retour>(inforesult-20)){
                succes="<h4 class='resultat' style='background:#78be50;'>"+game.i18n.localize('libersf.J26')+"</h4>";              
            }else if(retour>critique){
                succes="<h4 class='resultat' style='background:#78be50;'>"+game.i18n.localize('libersf.J27')+"</h4>";
            }else if(retour<=critique){
                succes="<h4 class='resultat' style='background:#78be50;'>"+game.i18n.localize('libersf.J28')+"</h4>";;                
            }  
        }else if(name=="Tir"){
            var bles=0;
            name+=" avec "+arme;       
            if(retour>95){
                succes="<h4 class='resultat' style='background:#ff3333;'>"+game.i18n.localize('libersf.J17')+"</h4>";
                deg='<h4 class="resultdeg">0</h4>';
                perte=0;
            }else if(retour>(inforesult+20)){
                succes="<h4 class='resultat' style='background:#ff5733;'>"+game.i18n.localize('libersf.J18')+"</h4>";
                deg='<h4 class="resultdeg">0</h4>';
                perte=0;
            }else if(retour>inforesult){
                succes="<h4 class='resultat' style='background:#ff5733;'>"+game.i18n.localize('libersf.J19')+"</h4>";
                deg='<h4 class="resultdeg">0</h4>';
            }else if(retour>(inforesult-20)){
                succes="<h4 class='resultat' style='background:#78be50;'>"+game.i18n.localize('libersf.J20')+"</h4>";
                deg='<h4 class="resultdeg">'+degat+'</h4>';
                bles=1;                
            }else if(retour>critique){
                succes="<h4 class='resultat' style='background:#78be50;'>"+game.i18n.localize('libersf.J21')+"</h4>";
                degat=Math.round(parseInt(degat)*1.5);
                deg='<h4 class="resultdeg">'+degat+'</h4>';
                bles=1;
            }else if(retour<=critique){
                succes="<h4 class='resultat' style='background:#78be50;'>"+game.i18n.localize('libersf.J22')+"</h4>";
                degat=parseInt(degat)*2;
                deg='<h4 class="resultdeg">'+degat+'</h4>';
                bles=1;               
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
                        }
                    }else if(type=="F" || type=="E"){
                        boucli=parseInt(boucli)-parseInt(degat)
                        degat=parseInt(degat)-parseInt(boucli)
                        if(boucli<0){
                            boucli=0;
                            hp=hp-parseInt(degat)
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
                            }
                        }        
                    }
                    
                    //diminier les armures et boucliers en fonction type d'arme
                    // retirer HP
                    if(bles>0){
                        hp=parseInt(hp)-degat;
                        if(hp<0){
                            hp=0; 
                            i.actor.createEmbeddedDocuments("ActiveEffect", [
                              {name: 'Mort', icon: 'icons/svg/skull.svg'}
                            ]);

                        }
                        i.actor.update({'system.stat.hp.value': hp,'system.stat.armure.value': armure,'system.stat.protections.value': boucli });
                    } 
                })
            }
           
        }else {
            if(retour>echec){
                succes="<h4 class='resultat' style='background:#ff3333;'>"+game.i18n.localize('libersf.echec')+"</h4>"+invonven;
            }else if(retour<=critique){
                succes="<h4 class='resultat' style='background:#7dff33;'>"+game.i18n.localize('libersf.echec2')+"</h4>"+avantage;
            }else if(retour<=inforesult){
                succes="<h4 class='resultat' style='background:#78be50;'>"+game.i18n.localize('libersf.echec3')+"</h4>";
            }else{
                succes="<h4 class='resultat' style='background:#ff5733;'>"+game.i18n.localize('libersf.echec4')+"</h4>";
            }
        }
        if(perte>0){
            let itemData= this.actor.items.filter(i=>i.name == chargequi);                 
            var iditem= itemData[0].id;
            var qty = itemData[0].system.quantite;
            console.log(perte)
            itemData[0].MunMoins(perte);
        } 
        
    
        if(inforesult<=0){
            succes="<h4 class='resultat' style='background:#ff3333;'>"+game.i18n.localize('libersf.echec')+"</h4>";
        }
        const texte = '<span style="flex:'+conf+'"><p style="text-align: center;font-size: medium;background: #00abab;padding: 5px;color: white;">'+game.i18n.localize('libersf.jet')+ name + " : " + retour +" / " + inforesult + ' ' + infoarme+'</p>'+ succes+'</span>'+deg;
        //roll.roll().toMessage({
        if (r && texte) {
            await r.toMessage({
                user: game.user._id,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: texte
            });
        }
    }
    async _choixtir(event) {
    return new Promise((resolve, reject) => {
        new Dialog({
            title: "Sélection du type de tir",
            content: `
                <form>
                    <div class="form-group">
                        <label for="typetir">Type de Tir :</label>
                        <select id="typetir" name="typetir">
                            <option value="As">Assomante</option>
                            <option value="A">Automatique</option>
                            <option value="C">Continu</option>
                            <option value="CC" selected>Coup par coup</option>
                            <option value="D">Dispersion</option>
                            <option value="L">Lourd</option>
                            <option value="H">Hors map</option>
                            <option value="R">Rafale</option>
                        </select>
                    </div>
                </form>
            `,
            buttons: {
                ok: {
                    label: "OK",
                    callback: (html) => {
                        const typetir = html.find('[name="typetir"]').val();
                        console.log(typetir); // This will correctly log the string value of the selected option
                        resolve(typetir);
                    }
                },
                cancel: {
                    label: "Annuler",
                    callback: () => resolve(null) // If cancelled, resolve with null or any appropriate value
                }
            },
            default: "ok"
        }).render(true);
    });
    }

    async _onMeca(event){
        return new Promise((resolve, reject) => {
            new Dialog({
                title: "Sélection du Niveau de Difficulté",
                content: `
                    <form>
                        <div class="form-group">
                            <label for="etoiles">Nombre d'Étoiles :</label>
                            <select id="etoiles" name="etoiles">
                                <option value="0">✬ ☆ ☆ ☆ ☆</option>
                                <option value="1">★ ☆ ☆ ☆ ☆</option>
                                <option value="2">★ ✬ ☆ ☆ ☆</option>
                                <option value="3">★ ★ ☆ ☆ ☆</option>
                                <option value="4">★ ★ ✬ ☆ ☆</option>
                                <option value="5">★ ★ ★ ☆ ☆</option>
                                <option value="6">★ ★ ★ ✬ ☆</option>
                                <option value="7">★ ★ ★ ★ ☆</option>
                                <option value="8">★ ★ ★ ★ ✬</option>
                                <option value="9">★ ★ ★ ★ ★</option>
                            </select>
                        </div>
                    </form>
                `,
                buttons: {
                    ok: {
                        label: "OK",
                        callback: (html) => {
                            const etoiles = parseInt(html.find('[name="etoiles"]').val());
                            resolve(etoiles);
                        }
                    },
                    cancel: {
                        label: "Annuler",
                        callback: () => resolve(0) // Si annulé, on considère zéro étoiles
                    }
                },
                default: "ok"
            }).render(true);
        });
    }

    _onStory(){
        const demeure = [game.i18n.localize("libersf.maison"),game.i18n.localize("libersf.hotel"),game.i18n.localize("libersf.chezUnAmi"),game.i18n.localize("libersf.demeure"),game.i18n.localize("libersf.sousUnPont"),game.i18n.localize("libersf.surUnBateau"),game.i18n.localize("libersf.ferme"),game.i18n.localize("libersf.auberge"),game.i18n.localize("libersf.commerceNegociation"),game.i18n.localize("libersf.forge"),game.i18n.localize("libersf.villa"),game.i18n.localize("libersf.cabane"),game.i18n.localize("libersf.appartement")];
        const proximite = [game.i18n.localize("libersf.surUnePlaneteDuSecteurDe"),game.i18n.localize("libersf.sur")];
        const lieu=["End-125","Proxima","Atarus","Sebos","ZX52","DX-128","ROF-89","HD-720P","Quenza","Sigma","TK86","Talouine","Turka","Rota","Imperator","Reset","Creab","87AB","TH5","R852","Natura","F10-X","Tella","Olympus","Iron","Zeus","Athena","Gaia","Apollon","Gallus","M-IP","Elysée","Grande nébuleuse","Tartare","Alexandrie","Maxima","74P-R","Centaurus","Nouvelle Terre","END-128","Terre","HAT-P1B","Valhala","Mystérious"]
        const titre = [game.i18n.localize("libersf.deContrebandier"),game.i18n.localize("libersf.deCommercant"),game.i18n.localize("libersf.deMilitaire"),game.i18n.localize("libersf.deColon"),game.i18n.localize("libersf.dAventuriers"),game.i18n.localize("libersf.dePilote"),game.i18n.localize("libersf.dArtisan"),game.i18n.localize("libersf.deMedecin"),game.i18n.localize("libersf.deMecanicien"),game.i18n.localize("libersf.dIntellectuel")];
        const rang = [game.i18n.localize("libersf.subordonne"),game.i18n.localize("libersf.chef"),game.i18n.localize("libersf.dirigeant"),game.i18n.localize("libersf.membre"),game.i18n.localize("libersf.adepte"),game.i18n.localize("libersf.affilie"),game.i18n.localize("libersf.cotisant"),game.i18n.localize("libersf.participant"),game.i18n.localize("libersf.soutien")];
        const organisation = [game.i18n.localize("libersf.deLEmpire"),game.i18n.localize("libersf.deLaRebellion"),game.i18n.localize("libersf.deLaPleide"),game.i18n.localize("libersf.deLOMC"),game.i18n.localize("libersf.deLaFederation"),game.i18n.localize("libersf.desFanatiques"),game.i18n.localize("libersf.duComiteDesPilotes"),game.i18n.localize("libersf.duComiteDesChasseurs"),game.i18n.localize("libersf.duComiteDesCommercants"),game.i18n.localize("libersf.duComiteDesVoyageurs"),game.i18n.localize("libersf.duComiteDesPhilosophes"),game.i18n.localize("libersf.duComiteDesArtistes"),game.i18n.localize("libersf.deLaGuildeDesContrebandier"),game.i18n.localize("libersf.duComiteDesMilitaire"),game.i18n.localize("libersf.deLaGuildeDesMercenaires"),game.i18n.localize("libersf.deLaGuildeDesTueursDeMonstres"),game.i18n.localize("libersf.deLaBandeDeBandits"),game.i18n.localize("libersf.deLaBandeDePirates")];
        const pertes = [game.i18n.localize("libersf.mere"),game.i18n.localize("libersf.pere"),game.i18n.localize("libersf.frere"),game.i18n.localize("libersf.soeur"),game.i18n.localize("libersf.amie"),game.i18n.localize("libersf.amant"),game.i18n.localize("libersf.personne"),game.i18n.localize("libersf.mentor"),game.i18n.localize("libersf.disciple"),game.i18n.localize("libersf.chefDeSonGroupe"),game.i18n.localize("libersf.oncle"),game.i18n.localize("libersf.cousin"),game.i18n.localize("libersf.neveu"),game.i18n.localize("libersf.fiancee"),game.i18n.localize("libersf.enfant"),game.i18n.localize("libersf.compagnonDArmes"),game.i18n.localize("libersf.rivale")];
        const race=[game.i18n.localize("libersf.humain"),game.i18n.localize("libersf.artu"),game.i18n.localize("libersf.dragon"),game.i18n.localize("libersf.dragon2"),game.i18n.localize("libersf.machine"),game.i18n.localize("libersf.pleiadiens"),game.i18n.localize("libersf.yor"),game.i18n.localize("libersf.elf"),game.i18n.localize("libersf.orqu")]
        const valeur = [game.i18n.localize("libersf.aucun"),game.i18n.localize("libersf.ethique"),game.i18n.localize("libersf.verteux"),game.i18n.localize("libersf.stoicisme"),game.i18n.localize("libersf.social"),game.i18n.localize("libersf.humaniste"),game.i18n.localize("libersf.questionnement"),game.i18n.localize("libersf.droit"),game.i18n.localize("libersf.juste"),game.i18n.localize("libersf.corrompu"),game.i18n.localize("libersf.egoiste"),game.i18n.localize("libersf.individualiste"),game.i18n.localize("libersf.communautaire")];
        const profession = [game.i18n.localize("libersf.voleur"),game.i18n.localize("libersf.pilote"),game.i18n.localize("libersf.artisan"),game.i18n.localize("libersf.assassin"),game.i18n.localize("libersf.garde"),game.i18n.localize("libersf.marchand"),game.i18n.localize("libersf.artisan"),game.i18n.localize("libersf.chasseur"),game.i18n.localize("libersf.chasseurDePrime"),game.i18n.localize("libersf.contrebandier"),game.i18n.localize("libersf.vagabond"),game.i18n.localize("libersf.navigateur"),game.i18n.localize("libersf.aubergiste"),game.i18n.localize("libersf.charlatant"),game.i18n.localize("libersf.artiste"),game.i18n.localize("libersf.diplomate"),game.i18n.localize("libersf.fonctionnaire"),game.i18n.localize("libersf.livreur"),game.i18n.localize("libersf.soldat"),game.i18n.localize("libersf.mercenaire")];
        const loisir = [game.i18n.localize("libersf.chasse"),game.i18n.localize("libersf.tricot"),game.i18n.localize("libersf.crochet"),game.i18n.localize("libersf.broderie"),game.i18n.localize("libersf.peinture"),game.i18n.localize("libersf.poésie"),game.i18n.localize("libersf.chant"),game.i18n.localize("libersf.acrobatie"),game.i18n.localize("libersf.danse"),game.i18n.localize("libersf.manger"),game.i18n.localize("libersf.promenade"),game.i18n.localize("libersf.peche"),game.i18n.localize("libersf.equitation"),game.i18n.localize("libersf.carte"),game.i18n.localize("libersf.jeuxDArgent"),game.i18n.localize("libersf.coureurDeJupon"),game.i18n.localize("libersf.vol"),game.i18n.localize("libersf.jardiner"),game.i18n.localize("libersf.lecture"),game.i18n.localize("libersf.dessin"),game.i18n.localize("libersf.poterie")];
        const caracterelist = [game.i18n.localize("libersf.social"),game.i18n.localize("libersf.individualiste"),game.i18n.localize("libersf.altruiste"),game.i18n.localize("libersf.fidele"),game.i18n.localize("libersf.infidel"),game.i18n.localize("libersf.egoisme"),game.i18n.localize("libersf.generosite"),game.i18n.localize("libersf.compassion"),game.i18n.localize("libersf.fraternel"),game.i18n.localize("libersf.devoue"),game.i18n.localize("libersf.croyant"),game.i18n.localize("libersf.vaniteux"),game.i18n.localize("libersf.forcene")];
        const personnalitelist = [game.i18n.localize("libersf.complexe"),game.i18n.localize("libersf.debrouillard"),game.i18n.localize("libersf.assiste"),game.i18n.localize("libersf.maniaque"),game.i18n.localize("libersf.bordelique"),game.i18n.localize("libersf.patient"),game.i18n.localize("libersf.impatient"),game.i18n.localize("libersf.superstitieux"),game.i18n.localize("libersf.rationnel"),game.i18n.localize("libersf.emotif"),game.i18n.localize("libersf.apathique"),game.i18n.localize("libersf.flegmatique"),game.i18n.localize("libersf.precieux"),game.i18n.localize("libersf.bourru"),game.i18n.localize("libersf.colerique"),game.i18n.localize("libersf.serieux"),game.i18n.localize("libersf.melancolique"),game.i18n.localize("libersf.sanguin")];
        const visionlist = [game.i18n.localize("libersf.barbare"),game.i18n.localize("libersf.danger"),game.i18n.localize("libersf.decouverte"),game.i18n.localize("libersf.connaissance"),game.i18n.localize("libersf.richesse"),game.i18n.localize("libersf.impie"),game.i18n.localize("libersf.demon"),game.i18n.localize("libersf.coeurAPrendre"),game.i18n.localize("libersf.monstre"),game.i18n.localize("libersf.gibier"),game.i18n.localize("libersf.mystere"),game.i18n.localize("libersf.bandit"),game.i18n.localize("libersf.secte"),game.i18n.localize("libersf.croyance")];
        const objectiflist = [game.i18n.localize("libersf.devenirRiche"),game.i18n.localize("libersf.libererDeLeurServitude"),game.i18n.localize("libersf.aiderSaCommunaute"),game.i18n.localize("libersf.aiderLaNature"),game.i18n.localize("libersf.rechercheSpirituel"),game.i18n.localize("libersf.tuerLesAutresRace"),game.i18n.localize("libersf.rechercheDeConnaissance")];
        const tarelist=[game.i18n.localize("libersf.caract279"),game.i18n.localize("libersf.caract280"),game.i18n.localize("libersf.caract281"),game.i18n.localize("libersf.caract282"),game.i18n.localize("libersf.caract283"),game.i18n.localize("libersf.caract284"),game.i18n.localize("libersf.caract285"),game.i18n.localize("libersf.caract286"),game.i18n.localize("libersf.caract287"),game.i18n.localize("libersf.caract288"),game.i18n.localize("libersf.caract289"),game.i18n.localize("libersf.caract290"),game.i18n.localize("libersf.caract291"),game.i18n.localize("libersf.caract292"),game.i18n.localize("libersf.caract293"),game.i18n.localize("libersf.caract294"),game.i18n.localize("libersf.caract295"),game.i18n.localize("libersf.caract296"),game.i18n.localize("libersf.caract297"),game.i18n.localize("libersf.caract298"),game.i18n.localize("libersf.caract299"),game.i18n.localize("libersf.caract300"),game.i18n.localize("libersf.caract301"),game.i18n.localize("libersf.caract302"),game.i18n.localize("libersf.caract303"),game.i18n.localize("libersf.caract304"),game.i18n.localize("libersf.caract305"),game.i18n.localize("libersf.caract306"),game.i18n.localize("libersf.caract307"),game.i18n.localize("libersf.caract308"),game.i18n.localize("libersf.caract309"),game.i18n.localize("libersf.caract310"),game.i18n.localize("libersf.caract311"),game.i18n.localize("libersf.caract312"),game.i18n.localize("libersf.caract313"),game.i18n.localize("libersf.caract314"),game.i18n.localize("libersf.caract315"),game.i18n.localize("libersf.caract316"),game.i18n.localize("libersf.caract317"),game.i18n.localize("libersf.caract318"),game.i18n.localize("libersf.caract319"),game.i18n.localize("libersf.caract320"),game.i18n.localize("libersf.caract321"),game.i18n.localize("libersf.caract322"),game.i18n.localize("libersf.caract323"),game.i18n.localize("libersf.caract324"),game.i18n.localize("libersf.caract325"),game.i18n.localize("libersf.caract326"),game.i18n.localize("libersf.caract327"),game.i18n.localize("libersf.caract328"),game.i18n.localize("libersf.caract329"),game.i18n.localize("libersf.caract330"),game.i18n.localize("libersf.caract331"),game.i18n.localize("libersf.caract332"),game.i18n.localize("libersf.caract333"),game.i18n.localize("libersf.caract334"),game.i18n.localize("libersf.caract335"),game.i18n.localize("libersf.caract336"),game.i18n.localize("libersf.caract337"),game.i18n.localize("libersf.caract338"),game.i18n.localize("libersf.caract339"),game.i18n.localize("libersf.caract340"),game.i18n.localize("libersf.caract341"),game.i18n.localize("libersf.caract342"),game.i18n.localize("libersf.caract343"),game.i18n.localize("libersf.caract344"),game.i18n.localize("libersf.caract345"),game.i18n.localize("libersf.caract346"),game.i18n.localize("libersf.caract347"),game.i18n.localize("libersf.caract348"),game.i18n.localize("libersf.caract349"),game.i18n.localize("libersf.caract350"),game.i18n.localize("libersf.caract351"),game.i18n.localize("libersf.caract352"),game.i18n.localize("libersf.caract353"),game.i18n.localize("libersf.caract354"),game.i18n.localize("libersf.caract355"),game.i18n.localize("libersf.caract356"),game.i18n.localize("libersf.caract357"),game.i18n.localize("libersf.caract358"),game.i18n.localize("libersf.caract359"),game.i18n.localize("libersf.caract360"),game.i18n.localize("libersf.caract361"),game.i18n.localize("libersf.caract362"),game.i18n.localize("libersf.caract363"),game.i18n.localize("libersf.caract364"),game.i18n.localize("libersf.caract36"),game.i18n.localize("libersf.caract366"),game.i18n.localize("libersf.caract367"),game.i18n.localize("libersf.caract368"),game.i18n.localize("libersf.caract369"),game.i18n.localize("libersf.caract370"),game.i18n.localize("libersf.caract371"),game.i18n.localize("libersf.caract372"),game.i18n.localize("libersf.caract373"),game.i18n.localize("libersf.caract374"),game.i18n.localize("libersf.caract375"),game.i18n.localize("libersf.caract376"),game.i18n.localize("libersf.caract377"),game.i18n.localize("libersf.caract378"),game.i18n.localize("libersf.caract379"),game.i18n.localize("libersf.caract380"),game.i18n.localize("libersf.caract381"),game.i18n.localize("libersf.caract382"),game.i18n.localize("libersf.caract383"),game.i18n.localize("libersf.caract384"),game.i18n.localize("libersf.caract385"),game.i18n.localize("libersf.caract386"),game.i18n.localize("libersf.caract387"),game.i18n.localize("libersf.caract388"),game.i18n.localize("libersf.caract389"),game.i18n.localize("libersf.caract390"),game.i18n.localize("libersf.caract391"),game.i18n.localize("libersf.caract392"),game.i18n.localize("libersf.caract393"),game.i18n.localize("libersf.caract394"),game.i18n.localize("libersf.caract395"),game.i18n.localize("libersf.caract396"),game.i18n.localize("libersf.caract397"),game.i18n.localize("libersf.caract398"),game.i18n.localize("libersf.caract399"),game.i18n.localize("libersf.caract400"),game.i18n.localize("libersf.caract401"),game.i18n.localize("libersf.caract402"),game.i18n.localize("libersf.caract403"),game.i18n.localize("libersf.caract404"),game.i18n.localize("libersf.caract405"),game.i18n.localize("libersf.caract406"),game.i18n.localize("libersf.caract407"),game.i18n.localize("libersf.caract408"),game.i18n.localize("libersf.caract409"),game.i18n.localize("libersf.caract410"),game.i18n.localize("libersf.caract411"),game.i18n.localize("libersf.caract412"),game.i18n.localize("libersf.caract413"),game.i18n.localize("libersf.caract414"),game.i18n.localize("libersf.caract415"),game.i18n.localize("libersf.caract416"),game.i18n.localize("libersf.caract417"),game.i18n.localize("libersf.caract418"),game.i18n.localize("libersf.caract419"),game.i18n.localize("libersf.caract420"),game.i18n.localize("libersf.caract421"),game.i18n.localize("libersf.caract422"),game.i18n.localize("libersf.caract423"),game.i18n.localize("libersf.caract424"),game.i18n.localize("libersf.caract425"),game.i18n.localize("libersf.caract426"),game.i18n.localize("libersf.caract427"),game.i18n.localize("libersf.caract428"),game.i18n.localize("libersf.caract429"),game.i18n.localize("libersf.caract430"),game.i18n.localize("libersf.caract431")]
        const racunelist=[game.i18n.localize("libersf.oui"),game.i18n.localize("libersf.non"),game.i18n.localize("libersf.bof")]

        let resident = demeure[Math.floor(Math.random()*demeure.length)]+" "+proximite[Math.floor(Math.random()*proximite.length)]+" "+lieu[Math.floor(Math.random()*lieu.length)];
        let sang = game.i18n.localize("libersf.issu")+" "+titre[Math.floor(Math.random()*titre.length)];     
        let politique=rang[Math.floor(Math.random()*rang.length)]+" "+organisation[Math.floor(Math.random()*organisation.length)];
        let groupe=organisation[Math.floor(Math.random()*organisation.length)];
        let dc=pertes[Math.floor(Math.random()*pertes.length)];
        let moral=valeur[Math.floor(Math.random()*valeur.length)];
        let amour=race[Math.floor(Math.random()*race.length)]+" "+rang[Math.floor(Math.random()*rang.length)]+" "+organisation[Math.floor(Math.random()*organisation.length)];
        let ami=race[Math.floor(Math.random()*race.length)]+" "+rang[Math.floor(Math.random()*rang.length)]+" "+organisation[Math.floor(Math.random()*organisation.length)];
        let haine=race[Math.floor(Math.random()*race.length)]+" "+rang[Math.floor(Math.random()*rang.length)]+" "+organisation[Math.floor(Math.random()*organisation.length)];
        let metier=profession[Math.floor(Math.random()*profession.length)];
        let metier1=profession[Math.floor(Math.random()*profession.length)];
        let metier2=loisir[Math.floor(Math.random()*loisir.length)];
        let caractere=caracterelist[Math.floor(Math.random()*caracterelist.length)];
        let personnalite=personnalitelist[Math.floor(Math.random()*personnalitelist.length)]
        let vision=game.i18n.localize("libersf.rempli")+visionlist[Math.floor(Math.random()*visionlist.length)]
        let objectif=objectiflist[Math.floor(Math.random()*objectiflist.length)]
        let tare=tarelist[Math.floor(Math.random()*tarelist.length)]
        let racune=racunelist[Math.floor(Math.random()*racunelist.length)]
        let obsession=racunelist[Math.floor(Math.random()*racunelist.length)]
        let distingue=racunelist[Math.floor(Math.random()*racunelist.length)]
        return {
            distingue,
            resident,
            sang,
            politique,
            groupe,
            dc,
            moral,
            amour,
            ami,
            haine,
            metier,
            metier1,
            metier2,
            caractere,
            personnalite,
            vision,
            objectif,
            tare,
            racune,
            obsession
        };
    }

    _onStory2(){
        var age = Math.floor((Math.random() * 34) + 16);
        const stages = [
            game.i18n.localize("libersf.code111"),
            game.i18n.localize("libersf.code112"),
            game.i18n.localize("libersf.code113"),
            game.i18n.localize("libersf.code114"),
            game.i18n.localize("libersf.code115"),
            game.i18n.localize("libersf.code116"),
            game.i18n.localize("libersf.code117"),
            game.i18n.localize("libersf.code118"),
            game.i18n.localize("libersf.code119"),
            game.i18n.localize("libersf.code120"),
            game.i18n.localize("libersf.code121")
        ];

        const elements = {};
        elements[game.i18n.localize("libersf.code111")] = [
            game.i18n.localize("libersf.code001"),
            game.i18n.localize("libersf.code002"),
            game.i18n.localize("libersf.code003"),
            game.i18n.localize("libersf.code004"),
            game.i18n.localize("libersf.code005"),
            game.i18n.localize("libersf.code006"),
            game.i18n.localize("libersf.code007"),
            game.i18n.localize("libersf.code008"),
            game.i18n.localize("libersf.code009"),
            game.i18n.localize("libersf.code010")
        ];
        elements[game.i18n.localize("libersf.code112")] = [
            game.i18n.localize("libersf.code011"),
            game.i18n.localize("libersf.code012"),
            game.i18n.localize("libersf.code013"),
            game.i18n.localize("libersf.code014"),
            game.i18n.localize("libersf.code015"),
            game.i18n.localize("libersf.code016"),
            game.i18n.localize("libersf.code017"),
            game.i18n.localize("libersf.code018"),
            game.i18n.localize("libersf.code019"),
            game.i18n.localize("libersf.code020")
        ];
        elements[game.i18n.localize("libersf.code113")] = [
            game.i18n.localize("libersf.code021"),
            game.i18n.localize("libersf.code022"),
            game.i18n.localize("libersf.code023"),
            game.i18n.localize("libersf.code024"),
            game.i18n.localize("libersf.code025"),
            game.i18n.localize("libersf.code026"),
            game.i18n.localize("libersf.code027"),
            game.i18n.localize("libersf.code028"),
            game.i18n.localize("libersf.code029"),
            game.i18n.localize("libersf.code030")
        ];
        elements[game.i18n.localize("libersf.code114")] = [
            game.i18n.localize("libersf.code031"),
            game.i18n.localize("libersf.code032"),
            game.i18n.localize("libersf.code033"),
            game.i18n.localize("libersf.code034"),
            game.i18n.localize("libersf.code035"),
            game.i18n.localize("libersf.code036"),
            game.i18n.localize("libersf.code037"),
            game.i18n.localize("libersf.code038"),
            game.i18n.localize("libersf.code039"),
            game.i18n.localize("libersf.code040")
        ];
        elements[game.i18n.localize("libersf.code115")] = [
            game.i18n.localize("libersf.code041"),
            game.i18n.localize("libersf.code042"),
            game.i18n.localize("libersf.code043"),
            game.i18n.localize("libersf.code044"),
            game.i18n.localize("libersf.code045"),
            game.i18n.localize("libersf.code046"),
            game.i18n.localize("libersf.code047"),
            game.i18n.localize("libersf.code048"),
            game.i18n.localize("libersf.code049"),
            game.i18n.localize("libersf.code050")
        ];
        elements[game.i18n.localize("libersf.code116")] = [
            game.i18n.localize("libersf.code051"),
            game.i18n.localize("libersf.code052"),
            game.i18n.localize("libersf.code053"),
            game.i18n.localize("libersf.code054"),
            game.i18n.localize("libersf.code055"),
            game.i18n.localize("libersf.code056"),
            game.i18n.localize("libersf.code057"),
            game.i18n.localize("libersf.code058"),
            game.i18n.localize("libersf.code059"),
            game.i18n.localize("libersf.code060")
        ];
        elements[game.i18n.localize("libersf.code117")] = [
            game.i18n.localize("libersf.code061"),
            game.i18n.localize("libersf.code062"),
            game.i18n.localize("libersf.code063"),
            game.i18n.localize("libersf.code064"),
            game.i18n.localize("libersf.code065"),
            game.i18n.localize("libersf.code066"),
            game.i18n.localize("libersf.code067"),
            game.i18n.localize("libersf.code068"),
            game.i18n.localize("libersf.code069"),
            game.i18n.localize("libersf.code070")
        ];
        elements[game.i18n.localize("libersf.code118")] = [
            game.i18n.localize("libersf.code071"),
            game.i18n.localize("libersf.code072"),
            game.i18n.localize("libersf.code073"),
            game.i18n.localize("libersf.code074"),
            game.i18n.localize("libersf.code075"),
            game.i18n.localize("libersf.code076"),
            game.i18n.localize("libersf.code077"),
            game.i18n.localize("libersf.code078"),
            game.i18n.localize("libersf.code079"),
            game.i18n.localize("libersf.code080")
        ];
        elements[game.i18n.localize("libersf.code119")] = [
            game.i18n.localize("libersf.code081"),
            game.i18n.localize("libersf.code082"),
            game.i18n.localize("libersf.code083"),
            game.i18n.localize("libersf.code084"),
            game.i18n.localize("libersf.code085"),
            game.i18n.localize("libersf.code086"),
            game.i18n.localize("libersf.code087"),
            game.i18n.localize("libersf.code088"),
            game.i18n.localize("libersf.code089"),
            game.i18n.localize("libersf.code090")
        ];
        elements[game.i18n.localize("libersf.code120")] = [
            game.i18n.localize("libersf.code091"),
            game.i18n.localize("libersf.code092"),
            game.i18n.localize("libersf.code093"),
            game.i18n.localize("libersf.code094"),
            game.i18n.localize("libersf.code095"),
            game.i18n.localize("libersf.code096"),
            game.i18n.localize("libersf.code097"),
            game.i18n.localize("libersf.code098"),
            game.i18n.localize("libersf.code099"),
            game.i18n.localize("libersf.code100")
        ];
        elements[game.i18n.localize("libersf.code121")] = [
            game.i18n.localize("libersf.code101"),
            game.i18n.localize("libersf.code102"),
            game.i18n.localize("libersf.code103"),
            game.i18n.localize("libersf.code104"),
            game.i18n.localize("libersf.code105"),
            game.i18n.localize("libersf.code106"),
            game.i18n.localize("libersf.code107"),
            game.i18n.localize("libersf.code108"),
            game.i18n.localize("libersf.code109"),
            game.i18n.localize("libersf.code110")
        ];
        let story = "";
        stages.forEach(stage => {
            const choices = elements[stage];
            const randomChoice = choices[Math.floor(Math.random() * choices.length)];
            story += `${stage}: ${randomChoice}\n\n`;
        });
        return story;
    }

    async _onAvantageRace(event){
        var clanliste=this.actor.system.background.race;
        var bonusrace='';
        if(clanliste=="r0"){
            bonusrace=game.i18n.localize("libersf.bonushumain");
        }else if(clanliste=="r2"){
            bonusrace=game.i18n.localize("libersf.bonusarthuriens");
        }else if(clanliste=="r4"){
            bonusrace=game.i18n.localize("libersf.bonusdraconiens");
        }else if(clanliste=="r6"){
            bonusrace=game.i18n.localize("libersf.bonusmachine");
        }else if(clanliste=="r1"){
            bonusrace=game.i18n.localize("libersf.bonuspleiadiens");
        }else if(clanliste=="r3"){
            bonusrace=game.i18n.localize("libersf.bonusyoribiens");
        }else if(clanliste=="r5"){
            bonusrace=game.i18n.localize("libersf.bonuselfen");
        }else if(clanliste=="r7"){
            bonusrace=game.i18n.localize("libersf.bonusorc");
        }else {
            bonusrace="";
        }
        
        var metierliste=this.actor.system.background.metier;
        var metier='';
        if(metierliste=="m1"){
            metier="10 "+game.i18n.localize("libersf.arti");
        }else if(metierliste=="m2"){
            metier="10 "+game.i18n.localize("libersf.nego");
        }else if(metierliste=="m3"){
            metier="10 "+game.i18n.localize("libersf.surv");
        }else if(metierliste=="m4"){
            metier="10 "+game.i18n.localize("libersf.inve");
        }else if(metierliste=="m5"){
            metier="10 "+game.i18n.localize("libersf.disc");
        }else if(metierliste=="m6"){
            metier="10 "+game.i18n.localize("libersf.pilo");
        }else if(metierliste=="m7"){
            metier="10 "+game.i18n.localize("libersf.mede");
        }else if(metierliste=="m8"){
            metier="10 "+game.i18n.localize("libersf.atir");
        }else if(metierliste=="m9"){
            metier="10 "+game.i18n.localize("libersf.meca");
        }else if(metierliste=="m10"){
            metier="10 "+game.i18n.localize("libersf.scie");
        }else if(metierliste=="m12"){
            metier="10 "+game.i18n.localize("Force");
        }
        let storyValues= await this._onStory();
        let story2= await this._onStory2();
        this.actor.update({'system.caractere.distingue': storyValues.distingue,
        'system.caractere.residence': storyValues.resident,
        'system.caractere.sang': storyValues.sang,
        'system.caractere.politique': storyValues.politique,
        'system.caractere.interets': storyValues.groupe,
        'system.caractere.deces': storyValues.dc,
        'system.caractere.moral': storyValues.moral,
        'system.caractere.amour': storyValues.amour,
        'system.caractere.amitie': storyValues.ami,
        'system.caractere.haine': storyValues.haine,
        'system.caractere.principale': storyValues.metier,
        'system.caractere.secondaire': storyValues.metier1,
        'system.caractere.passion': storyValues.metier2,
        'system.caractere.caract': storyValues.caractere,
        'system.caractere.personnalite': storyValues.personnalite,
        'system.caractere.perception': storyValues.vision,
        'system.caractere.objectif': storyValues.objectif,
        'system.caractere.rancunier': storyValues.racune,
        'system.caractere.tare': storyValues.tare,
        'system.caractere.obsession': storyValues.obsession,'system.background.histoire': story2,'system.background.bonusmetier': metier,'system.background.bonusrace': bonusrace});
    }

    _onArmor(event){//Fr
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
        var race = ["libersf.dog", "libersf.snake", "libersf.vermin", "libersf.bear", "libersf.leech", "libersf.lizard", "libersf.bird", "libersf.spider", "libersf.chimera", "libersf.frog"];
        var carc = ["libersf.ferocious", "libersf.dark", "libersf.huge", "libersf.formidable", "libersf.disturbing", "libersf.strange", "libersf.red", "libersf.invisible", "libersf.invincible"];
        var place = ["libersf.hellish", "libersf.shadowy", "libersf.from"];
        var type = ["libersf.flying", "libersf.underground", "libersf.marine"];
        var effect = ["libersf.paralyzes", "libersf.poisons", "libersf.detects4", "libersf.detects3", "libersf.detects2", "libersf.detects", "libersf.spits", "libersf.throws", "libersf.camouflages", "libersf.takes"];
        var img='systems/libersf/assets/icon/monstre.jpg';
        var nom= game.i18n.localize(race[Math.floor(Math.random()*race.length)]);
        var o=Math.random()*100;
        if(o>50){
            nom+=' '+game.i18n.localize(carc[Math.floor(Math.random()*carc.length)]);
        }
        o=Math.random()*100;
        if(o>50){
            nom+=' '+game.i18n.localize(lieu[Math.floor(Math.random()*lieu.length)]);
        }
        var t= game.i18n.localize(type[Math.floor(Math.random()*type.length)]);
        var e= game.i18n.localize(effe[Math.floor(Math.random()*effe.length)]);
        var dgt=Math.floor((Math.random()*5)*10);
        var ar=Math.floor((Math.random()*5)*10);
        var pv=Math.floor((Math.random()*5+1)*10);
        var desc=nom+' '+game.i18n.localize("libersf.animal")+' '+t+' '+game.i18n.localize("libersf.that")+' '+e+' '+game.i18n.localize("libersf.hits")+' '+dgt+game.i18n.localize("libersf.armorof")+' '+ar+' '+game.i18n.localize("libersf.andhas")+' '+pv+game.i18n.localize("libersf.HP")
        var cpt=[]
        var valeur=[-30,-20,-10,0,10,20,30,40]
        for (var i =0; i < 26; i++) {
            var v= valeur[Math.floor(Math.random()*valeur.length)];
            cpt.push(v);
        }
        this.actor.update({'name':nom,'img':img,'system.background.histoire':desc,'system.stat.hp.value': pv,'system.stat.hp.max': pv,'system.degatd': dgt,'system.armed':'Attaque','system.stat.armure.value': ar,'system.stat.armure.max': ar,'system.ptarm': ar,'system.prog':'armure Naturel','system.attributs.Agilité':cpt[0],'system.attributs.Artisanat':cpt[1],'system.attributs.Balistique':cpt[2],'system.attributs.Combat':cpt[3],'system.attributs.ConGén':cpt=[4],'system.attributs.ConSpécif':cpt=[5],'system.attributs.Dextérité':cpt=[6],'system.attributs.Diplomatie':cpt=[7],'system.attributs.Discrétion':cpt=[8],'system.attributs.Force':cpt=[9],'system.attributs.Investigation':cpt=[10],'system.attributs.Jeu':cpt=[11],'system.attributs.Mécanique':cpt=[12],'system.attributs.Médecine':cpt=[13],'system.attributs.Natation':cpt=[14],'system.attributs.Navigation':cpt=[15],'system.attributs.Négociation':cpt=[16],'system.attributs.Perception':cpt=[17],'system.attributs.Pilotage':cpt=[18],'system.attributs.Piratage':cpt=[19],'system.attributs.Pistage':cpt=[20],'system.attributs.Religion':cpt=[21],'system.attributs.Science':cpt=[22],'system.attributs.Survie':cpt=[23],'system.attributs.Tir':cpt=[24],'system.attributs.Visée':cpt=[25]});
    }

    _onCouv(event){
       let idn=event.target.dataset["lettre"];
        let effet=this.actor.effects;
        let lists=['libersf.sleeping','libersf.dizzy','libersf.blind','libersf.deaf','libersf.silenced','libersf.fearful','libersf.burning','libersf.frozen','libersf.invisible','libersf.blessed','libersf.poisoned','libersf.bleeding','libersf.unconscious','libersf.dead','libersf.covered']
        var nomRecherche=game.i18n.localize(lists[idn]);
        var estPresent = effet.some(function(element) {
            return element.name === nomRecherche;
        });
        var etre='Est';
        if (estPresent) {
            var effetAChercher = this.actor.effects.find(function(effect) {
                return effect.name === nomRecherche;
            });
            var idEffet = effetAChercher._id;

            // Suppression de l'effet en utilisant l'ID
            this.actor.deleteEmbeddedDocuments("ActiveEffect", [idEffet])
            //this.actor.update({[`system.etat.${etats[idn]}`]:0.5});
            etre=game.i18n.localize('notbe');
        } else {
            this.actor.createEmbeddedDocuments("ActiveEffect", [{name: nomRecherche}]);
        }
        var texte = "<span style='flex:auto'><p class='resultatp'>"+etre+" &nbsp; <span style='text-transform:uppercase;font-weight: bold;'> "+game.i18n.localize(lists[idn])+"</span></span></span>";
        let chatData = {
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: texte
        };
        ChatMessage.create(chatData, {});
    }
  
    _onEncom(data){
        const adata = data.actor;
        var  exo = adata.system.prog;
        var enc=parseInt(adata.system.attributs.Force) /2 + 35; 
        if(exo==game.i18n.localize('libersf.Exosquelette')){
           enc=enc*2; 
        }
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
        var surnom1 = ['libersf.surnom0', 'libersf.surnom1', 'libersf.surnom2', 'libersf.surnom3', 'libersf.surnom4', 'libersf.surnom5', 'libersf.surnom6'];
        var surnom2 = ['libersf.surnom7', 'libersf.surnom8', 'libersf.surnom9', 'libersf.surnom10', 'libersf.surnom11', 'libersf.surnom12', 'libersf.surnom13', 'libersf.surnom14', 'libersf.surnom15', 'libersf.surnom16', 'libersf.surnom17'];
        var typ = ['libersf.typ0', 'libersf.typ1', 'libersf.typ2', 'libersf.typ3', 'libersf.typ4', 'libersf.typ5', 'libersf.typ6'];
        var typ2 = ['libersf.typ20', 'libersf.typ21', 'libersf.typ22', 'libersf.typ23', 'libersf.typ24', 'libersf.typ25', 'libersf.typ26'];
        var huma=0; var drac=0;var plei=0;var elfe=0;var orqa=0;var artu=0;var mach=0;var yori=0;
        if(fact==1){//a corriger bug
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
        var surnom=game.i18n.localize(+surnom1[Math. round(Math.random() * surnom1.length)])+' '+game.i18n.localize(surnom2[Math. round(Math.random() * surnom2.length)]);
        var histoire=game.i18n.localize('libersf.its')+game.i18n.localize(type[Math. round(Math.random() * type.length)])+game.i18n.localize('libersf.with')+game.i18n.localize(type2[Math. round(Math.random() * type2.length)]);
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
        let cpt=[cpt0,cpt1,cpt2,cpt3,cpt4,cpt5,cpt6,cpt7,cpt8,cpt9,cpt10,cpt11,cpt12,cpt13,cpt14,cpt15,cpt16,cpt17,cpt18,cpt19,cpt20,cpt21,cpt22,cpt23,cpt24,cpt25,cpt26];

        for (var i = cpt.length - 1; i >= 0; i--) {
            let maxThreshold = 30;
            let minThreshold = -30;
            if (level == 1) {
                if (
                    (metier == "m1" && i == 1 && (race == "r6")) ||
                    (metier == "m3" && i == 23 && (race == "r2")) || 
                    (metier == "m5" && i == 8 && (race == "r1")) || 
                    (metier == "m5" && i == 8 && (race == "r5")) || 
                    (metier == "m6" && i == 18 && (race == "r4")) ||
                    (metier == "m6" && i == 18 && (race == "r7")) ||
                    (metier == "m6" && i == 18 && (race == "r0")) ||
                    (metier == "m10" && i == 22 && (race == "r0")) ||
                    (metier == "m3" && i == 23 && (race == "r3"))
                ) {
                    maxThreshold = 50;
                    minThreshold = -10;
                } else if (
                    (metier == "m1" && i == 1) ||
                    (metier == "m2" && i == 16) ||
                    (metier == "m4" && i == 11) ||
                    (metier == "m5" && i == 8) || 
                    (metier == "m6" && i == 18) || 
                    (metier == "m7" && i == 13) || 
                    (metier == "m8" && i == 24) || 
                    (metier == "m9" && i == 12) || 
                    (metier == "m10" && i == 22) || 
                    (metier == "m11" && i == 26) ||
                    (race == "r0" && (i == 2 || i == 7 || i == 17 || i == 22)) || 
                    (race == "r4"&& (i == 3 || i == 7 || i == 18)) || 
                    (race == "r2" && (i == 6 || i == 17 || i == 23)) || 
                    (race == "r6" && (i == 1 || i == 19 || i == 22)) || 
                    (race == "r1" && (i == 3 || i == 17 || i == 18)) || 
                    (race == "r3" && (i == 0 || i == 17 || i == 23)) || 
                    (race == "r5" && (i == 0 || i == 8 || i == 17)) || 
                    (race == "r7" && (i == 3 || i == 9 || i == 18))
                ) {
                    maxThreshold = 40;
                    minThreshold = -20;
                }
            } else if (parseInt(level) > 1) {
                maxThreshold = Infinity; // Aucune limite supérieure
                minThreshold = -30;
            }

            if (cpt[i] > maxThreshold) {
                cpt[i] = maxThreshold;
            } else if (parseInt(cpt[i]) < minThreshold) {
                cpt[i] = minThreshold;
            }
        }

        //activer les effets
       let effet=this.actor.effects;
        var effets=[];
        //var etats=['a','b','c','d','e','f','g','h','i','j','k','l','m','n'];
        var active=[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,0.5]
        var lists=['Endormi','Etourdi','Aveugle','Sourd','Réduit au silence','Apeuré','Brûlant','Gelé','Invisible','Béni','Empoisonné','Saignement','Inconscient','Mort','à Couvert']
        effet.forEach(function(item, index, array) {
            if(item.name!=''){
                effets.push(item.name);
            }
        });

        for(var i=0; i<lists.length; i++){
            for (var j=0; j < effets.length; j++) {
                if(lists[i]== effets[j]){
                    active[i]=1;
                }
            }
        }
        let context = {
            "system.attributs.Agilité": cpt[0],
            "system.attributs.Artisanat": cpt[1],
            "system.attributs.Balistique": cpt[2],
            "system.attributs.Combat": cpt[3],
            "system.attributs.ConGén": cpt[4],
            "system.attributs.ConSpécif": cpt[5],
            "system.attributs.Dextérité": cpt[6],
            "system.attributs.Diplomatie": cpt[7],
            "system.attributs.Discrétion": cpt[8],
            "system.attributs.Force": cpt[9],
            "system.attributs.Investigation": cpt[10],
            "system.attributs.Jeu": cpt[11],
            "system.attributs.Mécanique": cpt[12],
            "system.attributs.Médecine": cpt[13],
            "system.attributs.Natation": cpt[14],
            "system.attributs.Navigation": cpt[15],
            "system.attributs.Négociation": cpt[16],
            "system.attributs.Perception": cpt[17],
            "system.attributs.Pilotage": cpt[18],
            "system.attributs.Piratage": cpt[19],
            "system.attributs.Pistage": cpt[20],
            "system.attributs.Religion": cpt[21],
            "system.attributs.Science": cpt[22],
            "system.attributs.Survie": cpt[23],
            "system.attributs.Tir": cpt[24],
            "system.attributs.Visée": cpt[25],
            "system.attributs.magie": cpt[26],
            "system.background.etat.a": active[0],
            "system.background.etat.b": active[1],
            "system.background.etat.c": active[2],
            "system.background.etat.d": active[3],
            "system.background.etat.e": active[4],
            "system.background.etat.f": active[5],
            "system.background.etat.g": active[6],
            "system.background.etat.h": active[7],
            "system.background.etat.i": active[8],
            "system.background.etat.j": active[9],
            "system.background.etat.k": active[10],
            "system.background.etat.l": active[11],
            "system.background.etat.m": active[12],
            "system.background.etat.n": active[13]
        };   
        return context;    
    }

    _onStatV(event){
        let type = (this.actor.system.model.type.nb && typeof this.actor.system.model.type.nb === 'string') ? this.actor.system.model.type.nb.slice(1) : '';
        let etype = "";
        let tail = (this.actor.system.model.taille.nb && typeof this.actor.system.model.taille.nb === 'string') ? this.actor.system.model.taille.nb.slice(1) : '';
        let etail = "";
        let moteur = (this.actor.system.model.moteur.nb && typeof this.actor.system.model.moteur.nb === 'string') ? this.actor.system.model.moteur.nb.slice(1) : '';
        let blind = (this.actor.system.model.blindage.nb && typeof this.actor.system.model.blindage.nb === 'string') ? this.actor.system.model.blindage.nb.slice(1) : '';
        let ia = (this.actor.system.model.ia.nb && typeof this.actor.system.model.ia.nb === 'string') ? this.actor.system.model.ia.nb.slice(1) : '';

        let champ=0;let total=0;let coef=0;let arme=0;let piece=0;let ptia=0;let dif=0;let nrj=0;let pvmoteur=0;
        let background="";
        let blindage = this.actor.system.stat.armure.value;
        let blindagemax = this.actor.system.stat.armure.max;
        let enc=this.actor.system.stat.encombrement.value;
        let pvvalue=this.actor.system.stat.moteur.value;
        let technologie=(parseFloat(moteur)+parseFloat(ia)+parseFloat(blind))/6;
        let danger ="";
        let sun1=parseInt(moteur)/2;//bug
        let sun2=parseInt(ia)/2+parseInt(moteur)/2;//bug
        let sun3=parseInt(ia)/2-1;//bug
        let sun4=parseInt(ia)/2+1;//bug
        //Affichage background selon type de vaisseau, coef multiplicateur du prix et indication de la type du vaisseau
        if(type==1){
            etype=game.i18n.localize("libersf.type1");
            background='url(systems/libersf/css/air.png) center center no-repeat';
            coef=300;
        }else if(type==2){
            etype=game.i18n.localize("libersf.type2");
            background='url(systems/libersf/css/terre.png) center center no-repeat';
            coef=100;
        }else if(type==3){ 
            etype=game.i18n.localize("libersf.type3");
            background='url(systems/libersf/css/mer.png) center center no-repeat';
            coef=200
        }else if(type==4){
            etype=game.i18n.localize("libersf.type4");
            background='url(systems/libersf/css/vaisseau.png) center center no-repeat';
            coef=400;
        }
        //Affichage background selon type de vaisseau, coef multiplicateur du prix et indication de la taille du vaisseau
        if(tail==1){
            etail=game.i18n.localize("libersf.taille2");
            coef=coef * 400;
        }else if(tail==2){
            etail=game.i18n.localize("libersf.taille3");
            coef=coef * 800;
        }else if(tail==3){
            etail=game.i18n.localize("libersf.taille4");
            coef=coef * 1600;
        }else if(tail==4){
            etail=game.i18n.localize("libersf.taille4");
            coef=coef * 3200;
        }
        //Calcule du prix
        total=(parseInt(ia)+parseInt(type)+parseInt(moteur)+parseInt(tail)+parseInt(blind))*parseInt(coef);      


         //Indication du niveau de technologie, moteur etc
        function determinerSun(valeur) {
            if (valeur <= 0.5) {
                return "✬ ☆ ☆ ☆ ☆";
            } else if (valeur <= 1) {
                return "★ ☆ ☆ ☆ ☆";
            } else if (valeur <= 1.5) {
                return "★ ✬ ☆ ☆ ☆";
            } else if (valeur <= 2) {
                return "★ ★ ☆ ☆ ☆";
            } else if (valeur <= 2.5) {
                return "★ ★ ✬ ☆ ☆";
            } else if (valeur <= 3) {
                return "★ ★ ★ ☆ ☆";
            } else if (valeur <= 3.5) {
                return "★ ★ ★ ✬ ☆";
            } else if (valeur <= 4) {
                return "★ ★ ★ ★ ☆";
            } else if (valeur <= 4.5) {
                return "★ ★ ★ ★ ✬";
            } else {
                return "★ ★ ★ ★ ★";
            }
        }
        sun1 = determinerSun(sun1);
        sun2 = determinerSun(sun2);
        sun3 = determinerSun(sun3);
        sun4 = determinerSun(sun4);
        technologie = determinerSun(technologie);

        //indication du niveau du blindage
        let por=parseInt(blindage)*100/blindagemax;
        if(por<30){
            danger='#ff00003b';//rouge
        }else if(por<60){
            danger='#ffa5003b';//orange
        }else if(por<90){
            danger='#ccff003b';
        }else{
            danger='transparent';
        }       

        //calcule des différents niveau de blindage, champ de force, point d'ia, résistence moteur, nombre d'arme et de pièce disponible 
       // arme=parseFloat(ia)+parseFloat(blind)+1;
        arme=parseFloat(tail)*parseFloat(tail)+1;
        arme=Math.floor(arme);
        blind=(parseFloat(blind)*(parseFloat(tail)+2))*200;
        champ=(parseFloat(moteur)*(parseFloat(tail)+2))*200; 
        piece=Math.pow(tail-1, 3);
        ptia=ia*-10;   
        nrj=(parseFloat(moteur)*(parseFloat(moteur)))*200; 
        pvmoteur=(parseFloat(moteur)*(parseFloat(moteur)))*150;
        pvmoteur=Math.floor(pvmoteur);
        if(enc>nrj){enc=nrj}
        if(pvvalue>pvmoteur){pvvalue=pvmoteur}
        let context = {
            'system.stat.moteur.value': pvvalue,
            'system.stat.encombrement.value': enc,
            'system.stat.moteur.max': pvmoteur,
            'system.stat.encombrement.max': nrj,
            "system.stat.pointrestant": ptia,
            "system.model.point.piece": piece,
            "system.model.point.arme": arme,
            "system.stat.protections.max": champ,
            "system.stat.armure.max": blind,
            "system.back.danger": danger,
            "system.back.vaisseau": background,
            "system.model.tehnologie": technologie,
            "system.model.type.etoile": etype,
            "system.model.taille.etoile": etail,
            "system.model.moteur.etoile": sun1,
            "system.model.pilotage": sun2,
            "system.model.piratage": sun3,
            "system.model.vise": sun4,
            "system.stat.credit": total
        };
        return context;
    }
    _newV(event){
        let armure=this.actor.system.stat.armure.max;
        let moteur=this.actor.system.stat.moteur.max;
        let protections=this.actor.system.stat.protections.max;
        let encombrement=this.actor.system.stat.encombrement.max;
        let bouclier=parseInt(protections)/4;
        this.actor.update({"system.stat.armure.value":armure,"system.stat.moteur.value":moteur,"system.stat.protections.value":protections,"system.stat.encombrement.value":encombrement,"system.bouclier.babord.value":bouclier,"system.bouclier.babord.max":bouclier,"system.bouclier.tribord.value":bouclier,"system.bouclier.tribord.max":bouclier,"system.bouclier.poupe.value":bouclier,"system.bouclier.poupe.max":bouclier,"system.bouclier.proue.value":bouclier,"system.bouclier.proue.max":bouclier,})
    }
    _onNrj(event) {
        let classList = event.target.classList;
        let classes = Array.from(classList);
        let nrj = this.actor.system.stat.encombrement.value;
        let energyCost = 0;
        
        if (classes.includes("action10")) {
            energyCost = 20;
        } else if (classes.includes("action11")) {
            energyCost = 20;
        } else if (classes.includes("action12")) {
            energyCost = 10;
        } else if (classes.includes("action13")) {
            energyCost = 10;
        } else if (classes.includes("action14")) {
            energyCost = 30;
        } else if (classes.includes("action15")) {
            energyCost = 10;
        } else if (classes.includes("action16")) {
            energyCost = 50;
        } else if (classes.includes("action17")) {
            energyCost = 5;
        } else if (classes.includes("action18")) {
            energyCost = 20;
        } else if (classes.includes("action19")) {
            //si salle de machines
            energyCost = 0; // Update with the actual energy cost if necessary
        } else if (classes.includes("action20")) {
            energyCost = 20;
        } else if (classes.includes("action21")) {
            energyCost = 5;
        } else if (classes.includes("action22")) {
            energyCost = 5;
        } else if (classes.includes("action23")) {
            energyCost = 10; // si infirmerie
        } else if (classes.includes("action24")) {
            energyCost = 50;
        } else if (classes.includes("action25")) {
            energyCost = 20;
        } else if (classes.includes("action26")) {
            energyCost = 40;
        }

        if (parseInt(nrj) >= energyCost) {
            nrj = parseInt(nrj) - energyCost;
            this.actor.update({'system.stat.encombrement.value': nrj});

            if (classes.includes("action17")) {
                this._onVise(event); // choisir 'arme pour le tir'
            }
        } else {
            ui.notifications.warn("Action impossible, niveau d'énergie faible");
            var texte = "<h4 class='resultat' style='background:#ff3333;'>Action impossible, niveau d'énergie faible</h4>";
            let chatData = {
                speaker: ChatMessage.getSpeaker({ actor: this }),
                content: texte
            };
            ChatMessage.create(chatData, {});
        }
    }

    _onVise(event){
        const actorData = this.actor;
        const vise_vehicule = this.actor.system.attributs.Visée;
        const listarme = [];
        const malus=this.actor.system.malus;
        for (let i of actorData.items) {
            i.img = i.img || DEFAULT_TOKEN;
            if (i.type === "arme-véhicule") {
                listarme.push(`<option value="${i._id}" data-degat="${i.system.degats}" data-type="${i.system.type}">${i.name}</option>`); // Ajouter en option
            }
        }


        const content = `
        <form>
            <div class="">
                <label>Arme de véhicule :</label>
                <select class="choix-option" style="width: 265px;">${listarme.join('')}</select><br>
                <div style="width:49%;display:block; float:left;margin: 20px 0;">
                    <label>Bonus de visée du joueur :</label>
                    <input class="vise_joueur" type="text" value="0">
                </div>
                <div style="width:49%;display:block; float:left;margin: 20px 0;">
                    <label>Bonus / Malus :</label>
                    <input class="malus" type="text" value="${malus}">
                </div>
                <input class="vise_vehicule" type="text" value="${vise_vehicule}" style="display:none">
            </div>
        </form>
        `;

        // Affichage du dialogue
        new Dialog({
            title: "Choisissez une option",
            content: content,
            buttons: {
                ok: {
                    label: "OK",
                    callback: (html) => this._traiterChoix(html)
                },
                cancel: {
                    label: "Annuler"
                }
            },
            default: "ok",
            render: (html) => {
                // Agrandir la fenêtre de dialogue en hauteur
                html.closest('.app').css("height", "auto"); // Ajuster la hauteur automatiquement en fonction du contenu
                html.closest('.app').css("min-height", "200px"); // Définir une hauteur minimale (ajuster selon vos besoins)
            }
        }).render(true);
    }

    async _traiterChoix(html) {
        console.log("_traiterChoix")
        const choixElement = html.find('.choix-option');
        const choix = choixElement.val();
        let bonus = parseFloat(html.find('.vise_joueur').val() || 0); // Convertir en nombre
        let vise_vehicule = parseFloat(html.find('.vise_vehicule').val() || 0); // Convertir en nombre
        let malus = parseFloat(html.find('.malus').val() || 0); // Convertir en nombre
        let type = choixElement.find('option:selected').data("type");
        let degat = parseFloat(choixElement.find('option:selected').data("degat") || 0); // Convertir en nombre
        let conf="none;width: 200px;display:inline-block";
        const jetdeDesFormule = "1d100";

        var critique=5;
        if(type=="C"){
            critique=10;
        }
        var echec=95;
        if(type=="P"){
            echec=90;
        }
        
        if(bonus=='' || bonus ==undefined || bonus==null){
            bonus=0;
        }
        if(malus=='' || malus ==undefined || malus==null){
            malus=0;
        }
        var inforesult=parseInt(bonus)+parseInt(malus)+parseInt(vise_vehicule)+30;
        if(inforesult>echec){
            inforesult=echec;
        }
        
        let r = await new Roll('1d100').evaluate();
        let retour = r.result;
        var deg='';
        var perte=0;
        var succes="";
        if(retour>95){
            succes="<h4 class='resultat' style='background:#ff3333;'>"+game.i18n.localize('libersf.J17')+"</h4>";
            deg='<h4 class="resultdeg3"></h4>';
        }else if(retour>(inforesult+20)){
            succes="<h4 class='resultat' style='background:#ff5733;'>"+game.i18n.localize('libersf.J18')+"</h4>";
            deg='<h4 class="resultdeg2"></h4>';
        }else if(retour>inforesult){
            succes="<h4 class='resultat' style='background:#ff5733;'>"+game.i18n.localize('libersf.J19')+"</h4>";
            deg='<h4 class="resultdeg4"></h4>';
        }else if(retour>(inforesult-20)){
            succes="<h4 class='resultat' style='background:#78be50;'>"+game.i18n.localize('libersf.J20')+"</h4>";
            deg='<h4 class="resultdeg">'+degat+'</h4>';
        }else if(retour>critique){
            succes="<h4 class='resultat' style='background:#78be50;'>"+game.i18n.localize('libersf.J21')+"</h4>";
            degat=Math.round(parseInt(degat)*1.5);
            deg='<h4 class="resultdeg">'+degat+'</h4>';
        }else if(retour<=critique){
            succes="<h4 class='resultat' style='background:#78be50;'>"+game.i18n.localize('libersf.J22')+"</h4>";
            degat=parseInt(degat)*2;
            deg='<h4 class="resultdeg">'+degat+'</h4>';
        } 
        const texte = '<span style="flex:'+conf+'"><p style="text-align: center;font-size: medium;background: #00abab;padding: 5px;color: white;">'+game.i18n.localize('libersf.jet')+ 'Visée' + " : " + retour +" / " + inforesult + '</p>'+ succes+'</span>'+deg;
        //roll.roll().toMessage({
        if (r && texte) {
            await r.toMessage({
                user: game.user._id,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: texte
            });
        }
    }

    async competence(metier,compet) {
        // Mappage des valeurs de 'metier' à 'namemetier'
        const metierMap = {
            "m1": "Artisan",
            "m2": "Marchand",
            "m4": "Intellectuel",
            "m5": "Malandrins",
            "m6": "Pilote",
            "m7": "Médecin",
            "m8": "Militaire",
            "m9": "Technicien",
            "m12": "Combattant"
        };
        /*const packs = game.packs.get('libersf.planete');
        const table = await packs.getDocuments();
        console.log(table)*/
        // Trouver le nom du métier correspondant
        const namemetier = metierMap[metier] || "";

        // Vérification du pack et récupération des documents
        const pack = game.packs.get('libersf.competences');
        
        if (!pack) {
            console.error("Le pack 'libersf.competences' est introuvable.");
            return;
        }

        const tables = await pack.getDocuments();
        // Filtrer les documents en fonction de 'namemetier'
        const listem = tables.filter(value => {
            const prerequi = value.system.prerequi;
            const matchInCompet = compet.some(lvlItem => lvlItem.name === value.name);
            if (matchInCompet) {
                return false; // Ne pas inclure cet élément dans 'listem' si un match est trouvé
            }
            // Vérifier si le prerequi correspond à namemetier
            if (prerequi == namemetier) {
                return true;
            }
            
            // Vérifier si le prerequi correspond au nom d'un élément de level
            const matchInLevel = compet.some(lvlItem => lvlItem.name == prerequi);
            return matchInLevel;
        });
        let acc=[]
        // Retirer les éléments de level qui correspondent à listem
        for (let item of listem) {
            acc.push({
                label: item.name,
                value: item.name,
                img: item.img,
                description: item.system.description 
            });
        }
        return acc;
    }

    async _ajoutcompt(event) {
        // Récupérer la valeur de 'name' à partir de l'événement ou d'une autre source
        const name = this.actor.system.background.bonusmetierlvl;
        // Rechercher l'élément dans le pack 'libersf.competences'
        const pack = game.packs.get('libersf.competences');
        if (!pack) {
            console.error("Le pack 'libersf.competences' est introuvable.");
            return;
        }

        const tables = await pack.getDocuments();

        // Filtrer les documents en fonction du 'name'
        const listem = tables.filter(value => value.name === name);
        console.log(listem);

        // Logique à exécuter après avoir trouvé l'élément correspondant
        if (listem.length > 0) {
            // Accéder au premier élément trouvé (ou gérer plusieurs éléments si nécessaire)
            const { name, system, img } = listem[0];

            console.log('Élément trouvé:', { name, system, img });

            // Créer le document imbriqué avec les informations extraites
            this.actor.createEmbeddedDocuments('Item', [{
                name: name,
                img: img,
                type: 'level',
                'system.description': system.description,
                'system.prerequi': system.prerequi
            }], { renderSheet: false });
            this.actor.update({'system.background.bonusmetierlvl': ""});
            // Faites quelque chose avec name, description, et img
        } else {
            console.log('Aucun élément correspondant trouvé pour:', name);
        }
    }
}