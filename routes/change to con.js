const express = require('express');
const conController = require('../controllers/con');
const router = express.Router();

//connexionadmin
router.get('/adminlogin', conController.adminlogin);
router.post('/connexionadmin', conController.connexionadmin);
router.get('/database', conController.database);
router.get('/admincategorie', conController.admincategorie);
router.get('/editcategform', conController.editcategform);
router.get('/editcateg', conController.editcateg);
router.get('/adminproducts', conController.adminproducts);
router.get('/adminproductsearch', conController.adminproductsearch);
router.get('/editproduitform', conController.editproduitform);
router.get('/editproduit', conController.editproduit);
router.get('/editproduitforminfo', conController.editproduitform);
router.get('/editproduitforminfo', conController.editproduitinfo);
router.get('/editproduitinfo', conController.editproduitinfo);
router.get('/editproduitformecran', conController.editproduitform);
router.get('/editproduitformecran', conController.editproduitecran);
router.get('/editproduitecran', conController.editproduitecran);
router.get('/editproduitformdesktop', conController.editproduitform);
router.get('/editproduitformdesktop', conController.editproduitdesktop);
router.get('/editproduitdesktop', conController.editproduitdesktop);


//deleteproduit
router.get('/deleteproduit', conController.deleteproduit);
//deletecategorie
router.get('/deletecateg', conController.deletecateg);
//deleteclients
router.get('/deleteuser', conController.deleteuser);
///deletecommande
router.get('/deletecommande', conController.deletecommande);

//ajout produit
router.get('/adminaddproduct', conController.adminaddproduct);
router.get('/adminaddproductinfo', conController.adminaddproductinfo);
router.get('/adminaddproductecran', conController.adminaddproductecran);
router.get('/adminaddproductok', conController.adminaddproductok);
router.get('/adminaddproductinfook', conController.adminaddproductinfook);
router.get('/adminaddproductecranok', conController.adminaddproductecranok);
router.get('/adminaddmarque', conController.adminaddmarque);
router.get('/adminaddmarqueok', conController.adminaddmarqueok);
router.get('/adminaddcateg', conController.adminaddcateg);
router.get('/adminaddcategok', conController.adminaddcategok);



router.get('/adminmembres', conController.adminmembres);
router.get('/adminmembresearch', conController.adminmembresearch);
router.get('/edituserform', conController.edituserform);
router.get('/editmembre', conController.editmembre);
router.get('/admincommandes', conController.admincommandes);
router.get('/admincommandesearch', conController.admincommandesearch);
router.get('/editcommandeform', conController.editcommandeform);
router.get('/editcommande', conController.editcommande);
router.get('/validercommande', conController.validercommande);
router.get('/annulercommande', conController.annulercommande);
router.get('/admincommande', conController.pdfcommande);
router.get('/pdfcommande', conController.pdfcommande);
router.get('/admindisconnect', conController.admindisconnect);

router.get('/admincommandesacceptee', conController.admincommandesacceptee);
router.get('/admincommandesEncours', conController.admincommandesEncours);
//******************************************************************************************************* */


router.post('/connexion', conController.connexion);
router.get('/disconnect', conController.disconnect);
router.get('/adminretour', conController.adminretour);
router.get('/user', conController.user);
router.post('/updateuser', conController.updateuser);
router.post('/typedepaiement', conController.typedepaiement);

router.get('/ajoutproduitform', conController.ajoutproduitform);
router.post('/ajoutproduit', conController.ajoutproduit);

//listes des produits concernees aux clients
router.get('/laptop', conController.laptop);
router.get('/bracelet', conController.bracelet);
router.get('/desktop', conController.desktop);
router.get('/accessoirespourtv', conController.accessoirespourtv);
router.get('/android', conController.android);
router.get('/ecouteur', conController.ecouteur);
router.get('/hautparleur', conController.hautparleur);
router.get('/ios', conController.ios);
router.get('/montre', conController.montre);
router.get('/tv', conController.tv);
router.get('/ecran', conController.ecran);
router.get('/apropos', conController.apropos);
router.get('/indexproduct', conController.indexproduct);
router.get('/filterindexproduct', conController.indexproduct);

//voir detail do chaque produit
router.get('/produitinfo', conController.produitinfo);
router.get('/vide', conController.produitinfo);
router.get('/ajouteravis', conController.ajouteravis);
router.get('/productinfo', conController.produitinfo);

//ajouter un produit au panier
router.get('/ajouterpanier', conController.ajouterpanier);
//annuler produit panier
router.get('/paniersupprimer', conController.paniersupprimer);
//voirpanier
router.get('/panier', conController.panier);
router.get('/panierquantite', conController.panierquantite);

//ajoutercommande
router.get('/ajoutercommande', conController.ajoutercommande);
router.get('/commande', conController.commande);
router.get('/supprimercommande', conController.supprimercommande);
//filtrer les produits
router.post('/filterproduct', conController.filterproduct);

//detecter sil n y a pas des produits pour chaque categorie
router.get('/vide', conController.montre);
router.get('/vide', conController.bracelet);
router.get('/vide', conController.desktop);
router.get('/vide', conController.accessoirespourtv);
router.get('/vide', conController.android);
router.get('/vide', conController.ecouteur);
router.get('/vide', conController.hautparleur);
router.get('/vide', conController.ios);
router.get('/vide', conController.laptop);
router.get('/vide', conController.tv);
router.get('/vide', conController.ecran);

//page d'acceuil
router.get('/home', conController.home);
router.get('/connexion', conController.connexion);

//gerer profil client
router.get('/gererprofilc', conController.gererprofilc);
router.get('/gererprofilcform', conController.gererprofilc);
router.post('/gererprofilcok', conController.gererprofilcok);
router.get('/supprimerprofilc', conController.supprimerprofilc);

//search
router.get('/search', conController.search);

module.exports = router;