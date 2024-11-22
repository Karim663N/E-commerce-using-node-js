const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pdf = require('html-pdf');
const path = require('path');
var nodemailer = require('nodemailer');


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

//connexionadministrateur........................................................................

exports.adminlogin = (req, res) => {
    return res.render('adminlogin');
};

exports.connexionadmin = async (req, res) => {
    console.log(req.body);

    const { email, password } = req.body;

    try {
        // Check if the user exists based on the provided email and password
        db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (results.length === 0) {
                // If user does not exist or password is incorrect, render the admin login page with an error message
                return res.render('adminlogin', {
                    message: 'Email ou mot de passe invalide'
                });
            }

            // User exists and password is correct, retrieve user data
            const useradmin = results[0];
            // Store essential user information in the session
            req.session.userId = useradmin.id;
            req.session.userEmail = useradmin.email;
            req.session.useradmin = useradmin;

            // Check if the user is an admin
            if (useradmin) {
                // Redirect to /con/database to fetch and render the admin dashboard
                return res.redirect('/con/database');
            } else {
                // If the user is not an admin, render a different view
                // Example: return res.render('regularUserDashboard', { user });
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.admindisconnect = (req, res) => {
    // Destroy the session
    req.session.destroy((error) => {
        if (error) {
            console.error('Error destroying session:', error);
            // Handle error appropriately, e.g., send an error response
            return res.status(500).send('Internal Server Error');
        }
        // Redirect to the main page or any other page after successful disconnection
        return res.redirect('/con/adminlogin');
    });
};

exports.database = async (req, res) => {
    try {
        // Function to count commands from table commande where paye = 1
        const countPayeCommands = () => {
            return new Promise((resolve, reject) => {
                db.query('SELECT COUNT(*) AS commandepayecount FROM commande WHERE status = 1', (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results[0].commandepayecount);
                    }
                });
            });
        };

        // Function to count commands from table commande where paye = NULL
        const countUnpaidCommands = () => {
            return new Promise((resolve, reject) => {
                db.query('SELECT COUNT(*) AS commandenonpayecount FROM commande WHERE status IS NULL', (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results[0].commandenonpayecount);
                    }
                });
            });
        };

        // Function to count products from table produits
        const countProducts = () => {
            return new Promise((resolve, reject) => {
                db.query('SELECT COUNT(*) AS productCount FROM produits', (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results[0].productCount);
                    }
                });
            });
        };

        // Function to count users from table clients
        const countUsers = () => {
            return new Promise((resolve, reject) => {
                db.query('SELECT COUNT(*) AS userCount FROM clients', (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results[0].userCount);
                    }
                });
            });
        };

        // Function to count categories from table categorie
        const countCategories = () => {
            return new Promise((resolve, reject) => {
                db.query('SELECT COUNT(*) AS categoryCount FROM categorie', (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results[0].categoryCount);
                    }
                });
            });
        };

        const countAllCommands = () => {
            return new Promise((resolve, reject) => {
                db.query('SELECT COUNT(*) AS commandCount FROM commande', (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results[0].commandCount);
                    }
                });
            });
        };

        // Execute all count functions asynchronously
        const [commandepayecount, commandenonpayecount, productCount, userCount, categoryCount, commandCount] = await Promise.all([
            countPayeCommands(),
            countUnpaidCommands(),
            countProducts(),
            countUsers(),
            countCategories(),
            countAllCommands()
        ]);

        // Render the database view with count results
        return res.render('database', {
            message: 'Connexion r�ussie',
            useradmin: req.session.useradmin,
            commandepayecount,
            commandenonpayecount,
            productCount,
            userCount,
            categoryCount,
            commandCount
        });

    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.admincategorie = async (req, res) => {
    try {

        // Query to select all categories from the categorie table
        db.query('SELECT * FROM categorie', async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }
            const categories = results; // Changed from results[0] to results
            req.session.categories = categories;

            // Check if adminon === 1 regardless of database results
                return res.render('admincategorie', {
                    message: 'Liste des cat�gories',
                    categories,
                    useradmin: req.session.useradmin
                });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.editcategform = async (req, res) => {
    try {
        // Retrieve the category ID from the request
        const categoryId = req.query.id;

        // Query to select the category with the given ID
        db.query('SELECT * FROM categorie WHERE id = ?', [categoryId], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }
            const category = results[0]; // Retrieve the first category (assuming ID is unique)
            if (!category) {
                return res.status(404).send('Category not found'); // Handle case where category is not found
            }

            // Render the editcategform.hbs template with the category data
            return res.render('editcategform', {
                message: 'Modifier la cat�gorie',
                category,
                useradmin: req.session.useradmin
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.editcateg = async (req, res) => {
    try {
        // Retrieve the category ID and new category name from the form
        const categoryId = req.query.id;
        const newCategoryName = req.query.nomcateg;

        console.log('Category ID:', categoryId);
        console.log('New Category Name:', newCategoryName);

        // Query to update the category name
        db.query('UPDATE categorie SET nomcateg = ? WHERE id = ?', [newCategoryName, categoryId], async (error, results) => {
            if (error) {
                console.log('Error updating category:', error);
                return res.status(500).send('Internal Server Error');
            }

            console.log('Category updated successfully:', results);

            // Redirect to the admincategorie page after updating
            return res.redirect('/con/admincategorie');
        });
    } catch (error) {
        console.log('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.adminproducts = async (req, res) => {
    try {
        // Query to select all products from the produits table
        db.query('SELECT * FROM produits', async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }
            const produits = results; // Retrieve the products
            req.session.produits = produits;

            // Render the adminproducts.hbs template with the products data
            return res.render('adminproducts', {
                message: 'Liste des produits',
                produits,
                useradmin: req.session.useradmin
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.adminproductsearch = async (req, res) => {
    try {
        const search = req.query.search;
        // Query to select products where modele or reference matches the search term
        db.query('SELECT * FROM produits WHERE model LIKE ? OR reference LIKE ?', [`%${search}%`, `%${search}%`], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }
            const produits = results; // Retrieve the products
            req.session.produits = produits;

            // Render the adminproducts.hbs template with the filtered products data
            return res.render('adminproducts', {
                message: 'Liste des produits',
                produits,
                useradmin: req.session.useradmin
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.editproduitform = async (req, res) => {
    try {
        // Retrieve the product ID from the request
        const produitId = req.query.id;

        // Query to select the product with the given ID
        db.query('SELECT * FROM produits WHERE id = ?', [produitId], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }
            const produit = results[0]; // Retrieve the first product (assuming ID is unique)
            if (!produit) {
                return res.status(404).send('Data not found'); // Handle case where product is not found
            }

            // Check the value of produit.categorieid and render the appropriate template
            if (produit.categorieid === 1 || produit.categorieid === 4 || produit.categorieid === 5) {
                return res.render('editproduitforminfo', {
                    message: 'Modifier le produit',
                    produit,
                    useradmin: req.session.useradmin
                });
            } else if (produit.categorieid === 3 || produit.categorieid === 8) {
                return res.render('editproduitformecran', {
                    message: 'Modifier le produit',
                    produit,
                    useradmin: req.session.useradmin
                });
            } else if (produit.categorieid === 2) {
                return res.render('editproduitformdesktop', {
                    message: 'Modifier le produit',
                    produit,
                    useradmin: req.session.useradmin
                });
            } else {
                return res.render('editproduitform', {
                    message: 'Modifier le produit',
                    produit,
                    useradmin: req.session.useradmin
                });
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.editproduit = async (req, res) => {
    try {
        // Retrieve the product ID and new product details from the form
        const productId = req.query.id;
        const { reference, model, description, quantite, prix, promotion } = req.query;

        console.log('Product ID:', productId);
        console.log('New Product Details:', { reference, model, description, quantite, prix, promotion });

        // Query to update the product details
        db.query('UPDATE produits SET reference = ?, model = ?, description = ?, quantite = ?, prix = ?, promotion = ? WHERE id = ?',
            [reference, model, description, quantite, prix, promotion, productId],
            async (error, results) => {
                if (error) {
                    console.log('Error updating product:', error);
                    return res.status(500).send('Internal Server Error');
                }

                console.log('Product updated successfully:', results);

                // Query to update the product price based on promotion
                db.query('UPDATE produits SET prix = prix * (1 - (promotion / 100)) WHERE id = ? AND promotion IS NOT NULL', [productId], async (error) => {
                    if (error) {
                        console.log('Error updating product price based on promotion:', error);
                        return res.status(500).send('Internal Server Error');
                    }

                    // Redirect to the adminproducts page after updating
                    return res.redirect('/con/adminproducts');
                });
            }
        );
    } catch (error) {
        console.log('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
};


exports.editproduitinfo = async (req, res) => {
    try {
        // Retrieve the product ID and new product details from the form
        const productId = req.query.id;
        const { reference, model, description, quantite, prix, ram, stockage, cpu, gpu, ecran, tailleEcran, promotion } = req.query;

        console.log('Product ID:', productId);
        console.log('New Product Details:', { reference, model, description, quantite, prix, ram, stockage, cpu, gpu, ecran, tailleEcran, promotion });

        // Query to update the product details
        db.query('UPDATE produits SET reference = ?, model = ?, description = ?, quantite = ?, prix = ?, ram = ?, stockage = ?, ecran = ?, tailleEcran = ?, cpu = ?, gpu = ?, promotion = ? WHERE id = ?',
            [reference, model, description, quantite, prix, ram, stockage, ecran, tailleEcran, cpu, gpu, promotion, productId],
            async (error, results) => {
                if (error) {
                    console.log('Error updating product:', error);
                    return res.status(500).send('Internal Server Error');
                }

                console.log('Product updated successfully:', results);

                // Query to update the product price based on promotion
                db.query('UPDATE produits SET prix = prix * (1 - (promotion / 100)) WHERE id = ? AND promotion IS NOT NULL', [productId], async (error) => {
                    if (error) {
                        console.log('Error updating product price based on promotion:', error);
                        return res.status(500).send('Internal Server Error');
                    }

                    // Redirect to the adminproducts page after updating
                    return res.redirect('/con/adminproducts');
                });
            }
        );
    } catch (error) {
        console.log('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
};


exports.editproduitdesktop = async (req, res) => {
    try {
        // Retrieve the product ID and new product details from the form
        const productId = req.query.id;
        const { reference, model, description, quantite, prix, ram, stockage, cpu, gpu, promotion } = req.query;

        console.log('Product ID:', productId);
        console.log('New Product Details:', { reference, model, description, quantite, prix, ram, stockage, cpu, gpu, promotion });

        // Query to update the product details
        db.query('UPDATE produits SET reference = ?, model = ?, description = ?, quantite = ?, prix = ?, ram = ?, stockage = ?, cpu = ?, gpu = ?, promotion = ? WHERE id = ?',
            [reference, model, description, quantite, prix, ram, stockage, cpu, gpu, promotion, productId],
            async (error, results) => {
                if (error) {
                    console.log('Error updating product:', error);
                    return res.status(500).send('Internal Server Error');
                }

                console.log('Product updated successfully:', results);

                // Query to update the product price based on promotion
                db.query('UPDATE produits SET prix = prix * (1 - (promotion / 100)) WHERE id = ? AND promotion IS NOT NULL', [productId], async (error) => {
                    if (error) {
                        console.log('Error updating product price based on promotion:', error);
                        return res.status(500).send('Internal Server Error');
                    }

                    // Redirect to the adminproducts page after updating
                    return res.redirect('/con/adminproducts');
                });
            }
        );
    } catch (error) {
        console.log('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
};


exports.editproduitecran = async (req, res) => {
    try {
        // Retrieve the product ID and new product details from the form
        const productId = req.query.id;
        const { reference, model, description, quantite, prix, ecran, tailleEcran, promotion } = req.query;

        console.log('Product ID:', productId);
        console.log('New Product Details:', { reference, model, description, quantite, prix, ecran, tailleEcran, promotion });

        // Query to update the product details
        db.query('UPDATE produits SET reference = ?, model = ?, description = ?, quantite = ?, prix = ?, ecran = ?, tailleEcran = ?, promotion = ? WHERE id = ?',
            [reference, model, description, quantite, prix, ecran, tailleEcran, promotion, productId],
            async (error, results) => {
                if (error) {
                    console.log('Error updating product:', error);
                    return res.status(500).send('Internal Server Error');
                }

                console.log('Product updated successfully:', results);

                // Query to update the product price based on promotion
                db.query('UPDATE produits SET prix = prix * (1 - (promotion / 100)) WHERE id = ? AND promotion IS NOT NULL', [productId], async (error) => {
                    if (error) {
                        console.log('Error updating product price based on promotion:', error);
                        return res.status(500).send('Internal Server Error');
                    }

                    // Redirect to the adminproducts page after updating
                    return res.redirect('/con/adminproducts');
                });
            }
        );
    } catch (error) {
        console.log('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
};


exports.deleteproduit = async (req, res) => {
    try {
        // Retrieve the product ID from the request
        const productId = req.query.id;

        console.log('Product ID:', productId);

        // Query to delete the product based on its ID
        db.query('DELETE FROM produits WHERE id = ?', [productId], async (error, results) => {
            if (error) {
                console.log('Error deleting product:', error);
                return res.status(500).send('Internal Server Error');
            }

            console.log('Product deleted successfully:', results);

            // Redirect to the adminproducts page after deletion
            return res.redirect('/con/adminproducts');
        });
    } catch (error) {
        console.log('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.adminmembres = async (req, res) => {
    try {
        // Query to select all products from the produits table
        db.query('SELECT * FROM clients', async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }
            const clients = results; // Retrieve the products
            req.session.clients = clients;

            // Render the adminproducts.hbs template with the products data
            return res.render('adminmembres', {
                message: 'Liste des produits',
                clients,
                useradmin: req.session.useradmin
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.adminmembresearch = async (req, res) => {
    try {
        const search = req.query.search;
        // Query to select products where modele or reference matches the search term
        db.query('SELECT * FROM clients WHERE tel LIKE ?', [`%${search}%`], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }
            const clients = results; // Retrieve the products
            req.session.clients = clients;

            // Render the adminproducts.hbs template with the filtered products data
            return res.render('adminmembres', {
                message: 'Liste des clients',
                clients,
                useradmin: req.session.useradmin
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.edituserform = async (req, res) => {
    try {
        // Retrieve the category ID from the request
        const userId = req.query.id;

        // Query to select the category with the given ID
        db.query('SELECT * FROM clients WHERE id = ?', [userId], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }
            const client = results[0]; // Retrieve the first category (assuming ID is unique)
            if (!client) {
                return res.status(404).send('Data not found'); // Handle case where category is not found
            }

            // Render the editcategform.hbs template with the category data
            return res.render('edituserform', {
                message: 'Modifier le donnee dun client',
                client,
                useradmin: req.session.useradmin
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.editmembre = async (req, res) => {
    try {
        // Retrieve the product ID and new product details from the form
        const clientId = req.query.id;
        const { nom, prenom, email, tel, adresse } = req.query;

        console.log('Product ID:', clientId);
        console.log('New Product Details:', { nom, prenom, email, tel, adresse });

        // Query to update the product details
        db.query('UPDATE clients SET nom = ?, prenom = ?, email = ?, tel = ?, adresse = ? WHERE id = ?',
            [nom, prenom, email, tel, adresse, clientId],
            async (error, results) => {
                if (error) {
                    console.log('Error updating product:', error);
                    return res.status(500).send('Internal Server Error');
                }

                console.log('Member updated successfully:', results);

                // Redirect to the adminproducts page after updating
                return res.redirect('/con/adminmembres');
            });
    } catch (error) {
        console.log('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.deleteuser = async (req, res) => {
    try {
        // Retrieve the client ID from the request
        const clientId = req.query.id;

        console.log('Client ID:', clientId);

        // Query to delete the client
        db.query('DELETE FROM clients WHERE id = ?', [clientId], async (error, results) => {
            if (error) {
                console.log('Error deleting client:', error);
                return res.status(500).send('Internal Server Error');
            }

            console.log('Client deleted successfully:', results);

            // Redirect to the adminmembres page after deletion
            return res.redirect('/con/adminmembres');
        });
    } catch (error) {
        console.log('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.admincommandes = async (req, res) => {
    try {
        // Query to join the commande and client tables
        db.query('SELECT commande.*, clients.nom AS nom, clients.prenom AS prenom, clients.tel AS tel FROM commande ' +
            'INNER JOIN clients ON commande.useridc = clients.id', async (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }
                const commandes = results; // Retrieve the commandes
                req.session.commandes = commandes;

                // Render the admincommandes.hbs template with the commandes data
                return res.render('admincommandes', {
                    message: 'Liste des commandes',
                    commandes,
                    useradmin: req.session.useradmin
                });
            });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.editcommandeform = async (req, res) => {
    try {
        // Retrieve the category ID from the request
        const commandeId = req.query.id;

        // Query to select the category with the given ID
        db.query('SELECT commande.*, clients.nom, clients.prenom, clients.tel, clients.id AS idc FROM commande INNER JOIN clients ON commande.useridc = clients.id WHERE commande.id = ?', [commandeId], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }
            const commande = results[0]; // Retrieve the first category (assuming ID is unique)
            if (!commande) {
                return res.status(404).send('Data not found'); // Handle case where category is not found
            }

            // Render the editcategform.hbs template with the category data
            return res.render('editcommandeform', {
                message: 'Modifier le donnee dune commande',
                commande,
                useradmin: req.session.useradmin
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.admincommandesearch = async (req, res) => {
    try {
        const search = req.query.search;
        // Query to select products where modele or reference matches the search term
        db.query('SELECT commande.*, clients.nom AS nom, clients.prenom AS prenom, clients.tel AS tel FROM commande ' +
            'INNER JOIN clients ON commande.useridc = clients.id WHERE clients.tel LIKE ? OR clients.nom LIKE ? OR clients.prenom LIKE ?', [`%${search}%`, `%${search}%`, `%${search}%`], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }
            const commandes = results; // Retrieve the products
            req.session.commandes = commandes;

            // Render the adminproducts.hbs template with the filtered products data
            return res.render('admincommandes', {
                message: 'Liste des produits',
                commandes,
                useradmin: req.session.useradmin
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.editcommande = async (req, res) => {
    try {
        // Retrieve the product ID and new product details from the form
        const commandeId = req.query.id;
        const { nom, prenom, contact, date, quantite, total } = req.query;

        console.log('Commande ID:', commandeId);
        console.log('New Product Details:', { nom, prenom, contact, date, quantite, total });

        // Update the product details in the commande table
        db.query('UPDATE commande SET date = ?, quantite = ?, total = ? WHERE id = ?',
            [date, quantite, total, commandeId],
            async (error, results) => {
                if (error) {
                    console.log('Error updating product:', error);
                    return res.status(500).send('Internal Server Error');
                }

                console.log('Commande updated successfully:', results);

                // Update the corresponding row in the clients table
                db.query('UPDATE clients SET nom = ?, prenom = ?, tel = ? WHERE id = (SELECT useridc FROM commande WHERE id = ?)',
                    [nom, prenom, contact, commandeId],
                    async (error, results) => {
                        if (error) {
                            console.error('Error updating client:', error);
                            return res.status(500).send('Internal Server Error');
                        }

                        console.log('Client updated successfully');

                        // Redirect to the admincommandes page after updating
                        return res.redirect('/con/admincommandes');
                    });
            });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.validercommande = async (req, res) => {
    try {
        // Retrieve the commande ID from the request query
        const commandeId = req.query.id;

        console.log('Commande ID:', commandeId);

        // Update the status column in the commande table to 1
        db.query('UPDATE commande SET status = 1 WHERE id = ?', [commandeId], async (error, results) => {
            if (error) {
                console.log('Error updating status:', error);
                return res.status(500).send('Internal Server Error');
            }

            console.log('Status updated successfully');

            // Redirect to the admincommandes page after updating
            return res.redirect('/con/admincommandes');
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.annulercommande = async (req, res) => {
    try {
        // Retrieve the commande ID from the request query
        const commandeId = req.query.id;

        console.log('Commande ID:', commandeId);

        // Update the status column in the commande table to 0
        db.query('UPDATE commande SET status = 0 WHERE id = ?', [commandeId], async (error, results) => {
            if (error) {
                console.log('Error updating status:', error);
                return res.status(500).send('Internal Server Error');
            }

            console.log('Status updated successfully');

            // Redirect to the admincommandes page after updating
            return res.redirect('/con/admincommandes');
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.admincommandesacceptee = async (req, res) => {
    try {
        // Query to join the commande and client tables
        db.query('SELECT commande.*, clients.nom AS nom, clients.prenom AS prenom, clients.tel AS tel FROM commande ' +
            'INNER JOIN clients ON commande.useridc = clients.id ' +
            'WHERE commande.status = 1', async (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }
                const commandes = results; // Retrieve the commandes
                req.session.commandes = commandes;

                // Render the admincommandes.hbs template with the commandes data
                return res.render('admincommandes', {
                    message: 'Liste des commandes',
                    commandes,
                    useradmin: req.session.useradmin
                });
            });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.admincommandesEncours = async (req, res) => {
    try {
        // Query to join the commande and client tables
        db.query('SELECT commande.*, clients.nom AS nom, clients.prenom AS prenom, clients.tel AS tel FROM commande ' +
            'INNER JOIN clients ON commande.useridc = clients.id ' +
            'WHERE commande.status IS NULL', async (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }
                const commandes = results; // Retrieve the commandes
                req.session.commandes = commandes;

                // Render the admincommandes.hbs template with the commandes data
                return res.render('admincommandes', {
                    message: 'Liste des commandes',
                    commandes,
                    useradmin: req.session.useradmin
                });
            });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.pdfcommande = async (req, res) => {
    const commandeId = req.query.id; // Assuming command ID is sent in the request query

    try {
        // Fetch user ID from the commande table
        const userIdRows = await queryAsync('SELECT useridc FROM commande WHERE id = ?', [commandeId]);
        if (!userIdRows || userIdRows.length === 0) {
            console.error('No user ID found for the commande ID:', commandeId);
            return res.status(404).send('User ID not found');
        }
        const userId = userIdRows[0].useridc;

        // Fetch user details using the user ID
        const userRows = await queryAsync('SELECT * FROM clients WHERE id = ?', [userId]);
        if (!userRows || userRows.length === 0) {
            console.error('No user found for the user ID:', userId);
            return res.status(404).send('User not found');
        }
        const client = userRows[0];

        // Fetch command lines using the commande ID
        const commandeRows = await queryAsync(`
            SELECT cl.*, p.*, m.*
            FROM commandeligne cl
            JOIN produits p ON cl.produitid = p.id
            JOIN marque m ON p.marqueid = m.id
            WHERE cl.commandeid = ?
        `, [commandeId]);

        // Rendering the pdfcommande.hbs template with the fetched data
        const viewPath = path.join(__dirname, '..', 'views', 'pdfcommande');
        res.render(viewPath, {
            message: 'Commande Details',
            client,
            idcommande: commandeId,
            commandes: commandeRows
        }, (err, html) => {
            if (err) {
                console.error('Error rendering HTML:', err);
                return res.status(500).send('Internal Server Error');
            }

            // Options for PDF generation
            const pdfOptions = {
                format: 'A4',
                orientation: 'portrait'
                // Add any additional options as needed
            };

            // Convert HTML to PDF
            pdf.create(html, pdfOptions).toStream((err, stream) => {
                if (err) {
                    console.error('Error generating PDF:', err);
                    return res.status(500).send('Internal Server Error');
                }

                // Set response headers for PDF
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="commande_details.pdf"');

                // Send the PDF stream as response
                stream.pipe(res);
            });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Function to query the database asynchronously
function queryAsync(sql, args) {
    return new Promise((resolve, reject) => {
        db.query(sql, args, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}


exports.admindisconnect = (req, res) => {
    // Destroy the session
    req.session.destroy((error) => {
        if (error) {
            console.error('Error destroying session:', error);
            // Handle error appropriately, e.g., send an error response
            return res.status(500).send('Internal Server Error');
        }
        // Redirect to the main page or any other page after successful disconnection
        return res.redirect('/con/adminlogin');
    });
};
//...............................................................................................

exports.connexion = async (req, res) => {
    console.log(req.body);

    const { email, password } = req.body;

    try {
        db.query('SELECT * FROM clients WHERE email = ?', [email], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (results.length === 0) {
                return res.render('connexion', {
                    message: 'Email ou mot de passe invalide'
                });
            }

            const user = results[0];

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (isPasswordValid) {
                // Store essential user information in the session
                req.session.userId = user.id;
                req.session.userEmail = user.email;
                req.session.user = user;

                if (user.admin === 1) {
                    db.query('SELECT * FROM produits', (error, results) => {
                        if (error) {
                            console.log(error);
                            return res.status(500).send('Internal Server Error');
                        }
                        const adminon = user.admin;
                        req.session.adminon = adminon;

                        return res.render('database', {
                            message: 'login success',
                            user,
                            produits: results,
                            adminon // Pass the results of the query to the view
                        });
                    });
                } else {

                    //check total price in cart
                    const sumQuery = 'SELECT SUM(prixt) AS totalPrixt FROM panier WHERE useridc = ?';
                    db.query(sumQuery, [user.id], async (error, result) => {
                        if (error) {
                            console.error('Error calculating total prixt:', error);
                            return res.status(500).send('Internal Server Error');
                        }

                        // Extract the totalPrixt from the result
                        const totalPrixt = result[0].totalPrixt;
                        req.session.totalPrixt = totalPrixt
                        console.log(totalPrixt);
                        //connexion success clients
                        return res.render('index', {
                            user,
                            totalPrixt
                        });
                    });
                }
            } else {
                return res.render('connexion', {
                    message: 'Email ou mot de passe invalide'
                });
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}



exports.disconnect = (req, res) => {
    // Destroy the session
    req.session.destroy((error) => {
        if (error) {
            console.error('Error destroying session:', error);
            // Handle error appropriately, e.g., send an error response
            return res.status(500).send('Internal Server Error');
        }
        // Redirect to the main page or any other page after successful disconnection
        return res.redirect('/');
    });
};


//admin

exports.ajoutproduit = async (req, res) => {
    console.log(req.body);

    try {
        const { categorie, reference, marque, model, description, quantite, prix } = req.body;
        const id = 0; // Assuming you want to insert a new product with id = 0
        const adminon = req.session.user.admin;

        // Check if product with the same reference already exists
        db.query('SELECT * FROM produits WHERE reference = ?', [reference], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            // If product with the same reference exists, return error
            if (results.length > 0) {
                return res.render('ajoutproduitform', {
                    message: 'Produit deja existe'
                });
            }

            if (adminon === 1) {
                const sqlQuery = `
                    INSERT INTO produits (categorie, reference, marque, model, description, quantite, prix)
                    VALUES (?, ?, ?, ?, ?, ?, ?);
                `;

                // Execute the SQL query to insert new product
                db.query(sqlQuery, [categorie, reference, marque, model, description, quantite, prix], async (error, results) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).send('Internal Server Error');
                    }
                    return res.render('ajoutproduitform', {
                        message: 'Produit ajoutee',
                        user: req.session.user, // Use req.session.user to pass user
                        adminon // Pass the results of the query to the view
                    });
                });
            } else {
                return res.render('index', { user: req.session.user }); // Use req.session.user to pass user
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.ajoutproduitform = async (req, res) => {
    console.log(req.body);

    try {
        const adminon = req.session.user.admin; // Define adminon here
        db.query('SELECT * FROM produits', async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (results.length === 0) {
                return res.render('listeprosuits', {
                    message: 'Aucun produit disponible'
                });
            }

            const produits = results; // Changed from results[0] to results
            req.session.produits = produits;
            if (adminon === 1) {
                return res.render('ajoutproduitform', {
                    message: 'ajouter un nouveau produit',
                    user: req.session.user, // Use req.session.user to pass user
                    produits,
                    adminon // Pass the results of the query to the view
                });
            } else {
                return res.render('index', { user: req.session.user }); // Use req.session.user to pass user
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.adminretour = async (req, res) => {
    console.log(req.body);

    try {
        const adminon = req.session.user.admin; // Define adminon here
        db.query('SELECT * FROM produits', async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (results.length === 0) {
                return res.render('listeprosuits', {
                    message: 'Aucun produit disponible'
                });
            }

            const produits = results; // Changed from results[0] to results
            req.session.produits = produits;
            if (adminon === 1) {
                return res.render('database', {
                    message: 'liste des produits',
                    user: req.session.user, // Use req.session.user to pass user
                    produits,
                    adminon // Pass the results of the query to the view
                });
            } else {
                return res.render('index', { user: req.session.user }); // Use req.session.user to pass user
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

//user

exports.user = async (req, res) => {
    try {
        // Retrieve user information from the session
        const userId = req.session.userId;

        if (!userId) {
            // If user ID is not found in the session, redirect to login page
            return res.redirect('/connexion');
        }

        // Fetch user data from the database based on the user ID stored in the session
        db.query('SELECT * FROM users WHERE id = ?', [userId], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (results.length === 0) {
                return res.render('connexion', {
                    message: 'Email ou mot de passe invalide'
                });
            }

            const user = results[0];

            // Render the userform page with user data
            return res.render('userform', { user });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.updateuser = async (req, res) => {
    console.log(req.body);

    const { nom, prenom, tel, email, password, passwordConfirm } = req.body;
    const userId = req.session.userId;

    try {
        if (password !== passwordConfirm) {
            return res.render('userform', {
                status: 'Mots de passe non identiques',
                userId
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        // Update user in the database
        db.query('UPDATE users SET ? WHERE id = ?', [{ nom, prenom, tel, email, password: hashedPassword }, userId], (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            } else {
                console.log(results);
                return res.render('userform', {
                    status: 'Compte a �t� modifi�',
                    userId
                });
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

//affichage des produits pour les clients

exports.laptop = async (req, res) => {
    console.log(req.body);

    try {
        db.query('SELECT produits.*, marque.nommarque FROM produits JOIN marque ON produits.marqueid = marque.id WHERE produits.categorieid = 1', async (error, products) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (products.length === 0) {
                return res.render('vide', {
                    user: req.session.user,
                    message: 'Aucun produit disponible'
                });
            }

            const produits = products; // Changed from results[0] to results
            req.session.produits = produits;

            // Fetch unique marque values
            db.query('SELECT id, nommarque FROM marque WHERE id IN (SELECT DISTINCT marqueid FROM produits WHERE categorieid = 1)', async (error, uniqueMarques) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }

                // Fetching distinct RAM values
                db.query('SELECT DISTINCT ram FROM produits WHERE categorieid = 1', async (error, ramDetails) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).send('Internal Server Error');
                    }

                    // Fetching distinct stockage values
                    // Fetching distinct stockage values
                    db.query('SELECT DISTINCT stockage FROM produits WHERE categorieid = 1', async (error, stockageDetails) => {
                        if (error) {
                            console.log(error);
                            return res.status(500).send('Internal Server Error');
                        }

                        const stockageDetail = stockageDetails.map(result => result.stockage);

                        // Fetching distinct ecran values
                        db.query('SELECT DISTINCT ecran FROM produits WHERE categorieid = 1', async (error, ecranDetails) => {
                            if (error) {
                                console.log(error);
                                return res.status(500).send('Internal Server Error');
                            }

                            const ecranDetail = ecranDetails.map(result => result.ecran);

                            // Fetching distinct tailleecran values
                            db.query('SELECT DISTINCT tailleEcran FROM produits WHERE categorieid = 1', async (error, tailleEcranDetails) => {
                                if (error) {
                                    console.log(error);
                                    return res.status(500).send('Internal Server Error');
                                }

                                const tailleEcranDetail = tailleEcranDetails.map(result => result.tailleEcran);

                                // Fetching distinct cpu values
                                db.query('SELECT DISTINCT cpu FROM produits WHERE categorieid = 1', async (error, cpuDetails) => {
                                    if (error) {
                                        console.log(error);
                                        return res.status(500).send('Internal Server Error');
                                    }

                                    const cpuDetail = cpuDetails.map(result => result.cpu);

                                    // Fetching distinct gpu values
                                    db.query('SELECT DISTINCT gpu FROM produits WHERE categorieid = 1', async (error, gpuDetails) => {
                                        if (error) {
                                            console.log(error);
                                            return res.status(500).send('Internal Server Error');
                                        }

                                        const gpuDetail = gpuDetails.map(result => result.gpu);

                                        // Render the page with fetched details
                                        if (req.session.user) {
                                            return res.render('laptop', {
                                                message: 'liste des produits',
                                                user: req.session.user,
                                                produits,
                                                uniqueMarques: uniqueMarques.map(result => result.nommarque),
                                                ramDetails: ramDetails.map(result => result.ram),
                                                stockageDetails: stockageDetail, // Modified
                                                ecranDetails: ecranDetail, // Modified
                                                tailleEcranDetails: tailleEcranDetail, // Modified
                                                cpuDetails: cpuDetail, // Modified
                                                gpuDetails: gpuDetail // Modified
                                            });
                                        } else {
                                            return res.render('laptop', {
                                                message: 'liste des produits',
                                                produits,
                                                uniqueMarques: uniqueMarques.map(result => result.nommarque),
                                                ramDetails: ramDetails.map(result => result.ram),
                                                stockageDetails: stockageDetail, // Modified
                                                ecranDetails: ecranDetail, // Modified
                                                tailleEcranDetails: tailleEcranDetail, // Modified
                                                cpuDetails: cpuDetail, // Modified
                                                gpuDetails: gpuDetail // Modified
                                            });
                                        }
                                    });
                                });
                            });
                        });
                    });

                });

            });

        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.accessoirespourtv = async (req, res) => {
    console.log(req.body);

    try {
        db.query('SELECT * FROM produits WHERE categorieid = 9', async (error, products) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (products.length === 0) {
                return res.render('vide', {
                    user: req.session.user,
                    message: 'Aucun produit disponible'
                });
            }

            const produits = products; // Changed from results[0] to results
            req.session.produits = produits;

            // Fetch unique marque values
            db.query('SELECT id, nommarque FROM marque WHERE id IN (SELECT DISTINCT marqueid FROM produits WHERE categorieid = 9)', async (error, uniqueMarques) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }

                if (req.session.user) {
                    return res.render('accessoirespourtv', {
                        message: 'liste des produits',
                        user: req.session.user, // Use req.session.user to pass user
                        produits,
                        totalPrixt: req.session.totalPrixt,
                        uniqueMarques: uniqueMarques.map(result => result.nommarque) // Extract unique marque names
                    });
                } else {
                    return res.render('accessoirespourtv', {
                        message: 'liste des produits',
                        produits,
                        uniqueMarques: uniqueMarques.map(result => result.nommarque) // Extract unique marque names
                    });
                }
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.android = async (req, res) => {
    console.log(req.body);

    try {
        db.query('SELECT produits.*, marque.nommarque FROM produits JOIN marque ON produits.marqueid = marque.id WHERE produits.categorieid = 4', async (error, products) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (products.length === 0) {
                return res.render('vide', {
                    user: req.session.user,
                    message: 'Aucun produit disponible'
                });
            }

            const produits = products; // Changed from results[0] to results
            req.session.produits = produits;

            // Fetch unique marque values
            db.query('SELECT id, nommarque FROM marque WHERE id IN (SELECT DISTINCT marqueid FROM produits WHERE categorieid = 4)', async (error, uniqueMarques) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }

                // Fetching distinct RAM values
                db.query('SELECT DISTINCT ram FROM produits WHERE categorieid = 4', async (error, ramDetails) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).send('Internal Server Error');
                    }

                    // Fetching distinct stockage values
                    // Fetching distinct stockage values
                    db.query('SELECT DISTINCT stockage FROM produits WHERE categorieid = 4', async (error, stockageDetails) => {
                        if (error) {
                            console.log(error);
                            return res.status(500).send('Internal Server Error');
                        }

                        const stockageDetail = stockageDetails.map(result => result.stockage);

                        // Fetching distinct ecran values
                        db.query('SELECT DISTINCT ecran FROM produits WHERE categorieid = 4', async (error, ecranDetails) => {
                            if (error) {
                                console.log(error);
                                return res.status(500).send('Internal Server Error');
                            }

                            const ecranDetail = ecranDetails.map(result => result.ecran);

                            // Fetching distinct tailleecran values
                            db.query('SELECT DISTINCT tailleEcran FROM produits WHERE categorieid = 4', async (error, tailleEcranDetails) => {
                                if (error) {
                                    console.log(error);
                                    return res.status(500).send('Internal Server Error');
                                }

                                const tailleEcranDetail = tailleEcranDetails.map(result => result.tailleEcran);

                                // Fetching distinct cpu values
                                db.query('SELECT DISTINCT cpu FROM produits WHERE categorieid = 4', async (error, cpuDetails) => {
                                    if (error) {
                                        console.log(error);
                                        return res.status(500).send('Internal Server Error');
                                    }

                                    const cpuDetail = cpuDetails.map(result => result.cpu);

                                    // Fetching distinct gpu values
                                    db.query('SELECT DISTINCT gpu FROM produits WHERE categorieid = 4', async (error, gpuDetails) => {
                                        if (error) {
                                            console.log(error);
                                            return res.status(500).send('Internal Server Error');
                                        }

                                        const gpuDetail = gpuDetails.map(result => result.gpu);

                                        // Render the page with fetched details
                                        if (req.session.user) {
                                            return res.render('android', {
                                                message: 'liste des produits',
                                                user: req.session.user,
                                                produits,
                                                uniqueMarques: uniqueMarques.map(result => result.nommarque),
                                                ramDetails: ramDetails.map(result => result.ram),
                                                stockageDetails: stockageDetail, // Modified
                                                ecranDetails: ecranDetail, // Modified
                                                tailleEcranDetails: tailleEcranDetail, // Modified
                                                cpuDetails: cpuDetail, // Modified
                                                gpuDetails: gpuDetail // Modified
                                            });
                                        } else {
                                            return res.render('android', {
                                                message: 'liste des produits',
                                                produits,
                                                uniqueMarques: uniqueMarques.map(result => result.nommarque),
                                                ramDetails: ramDetails.map(result => result.ram),
                                                stockageDetails: stockageDetail, // Modified
                                                ecranDetails: ecranDetail, // Modified
                                                tailleEcranDetails: tailleEcranDetail, // Modified
                                                cpuDetails: cpuDetail, // Modified
                                                gpuDetails: gpuDetail // Modified
                                            });
                                        }
                                    });
                                });
                            });
                        });
                    });

                });

            });

        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.bracelet = async (req, res) => {
    console.log(req.body);

    try {
        db.query('SELECT * FROM produits WHERE categorieid = 6', async (error, products) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (products.length === 0) {
                return res.render('vide', {
                    user: req.session.user,
                    message: 'Aucun produit disponible'
                });
            }

            const produits = products; // Changed from results[0] to results
            req.session.produits = produits;

            // Fetch unique marque values
            db.query('SELECT id, nommarque FROM marque WHERE id IN (SELECT DISTINCT marqueid FROM produits WHERE categorieid = 6)', async (error, uniqueMarques) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }

                if (req.session.user) {
                    return res.render('bracelet', {
                        message: 'liste des produits',
                        user: req.session.user, // Use req.session.user to pass user
                        produits,
                        totalPrixt: req.session.totalPrixt,
                        uniqueMarques: uniqueMarques.map(result => result.nommarque) // Extract unique marque names
                    });
                } else {
                    return res.render('bracelet', {
                        message: 'liste des produits',
                        produits,
                        uniqueMarques: uniqueMarques.map(result => result.nommarque) // Extract unique marque names
                    });
                }
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.desktop = async (req, res) => {
    console.log(req.body);

    try {
        db.query('SELECT produits.*, marque.nommarque FROM produits JOIN marque ON produits.marqueid = marque.id WHERE produits.categorieid = 2', async (error, products) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (products.length === 0) {
                return res.render('vide', {
                    user: req.session.user,
                    message: 'Aucun produit disponible'
                });
            }

            const produits = products; // Changed from results[0] to results
            req.session.produits = produits;

            // Fetch unique marque values
            db.query('SELECT id, nommarque FROM marque WHERE id IN (SELECT DISTINCT marqueid FROM produits WHERE categorieid = 2)', async (error, uniqueMarques) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }

                // Fetching distinct RAM values
                db.query('SELECT DISTINCT ram FROM produits WHERE categorieid = 2', async (error, ramDetails) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).send('Internal Server Error');
                    }

                    // Fetching distinct stockage values
                    // Fetching distinct stockage values
                    db.query('SELECT DISTINCT stockage FROM produits WHERE categorieid = 2', async (error, stockageDetails) => {
                        if (error) {
                            console.log(error);
                            return res.status(500).send('Internal Server Error');
                        }

                        const stockageDetail = stockageDetails.map(result => result.stockage);

                        // Fetching distinct ecran values
                        // Fetching distinct cpu values
                        db.query('SELECT DISTINCT cpu FROM produits WHERE categorieid = 2', async (error, cpuDetails) => {
                            if (error) {
                                console.log(error);
                                return res.status(500).send('Internal Server Error');
                            }

                            const cpuDetail = cpuDetails.map(result => result.cpu);

                            // Fetching distinct gpu values
                            db.query('SELECT DISTINCT gpu FROM produits WHERE categorieid = 2', async (error, gpuDetails) => {
                                if (error) {
                                    console.log(error);
                                    return res.status(500).send('Internal Server Error');
                                }

                                const gpuDetail = gpuDetails.map(result => result.gpu);

                                // Render the page with fetched details
                                if (req.session.user) {
                                    return res.render('desktop', {
                                        message: 'liste des produits',
                                        user: req.session.user,
                                        produits,
                                        uniqueMarques: uniqueMarques.map(result => result.nommarque),
                                        ramDetails: ramDetails.map(result => result.ram),
                                        stockageDetails: stockageDetail, // Modified
                                        cpuDetails: cpuDetail, // Modified
                                        gpuDetails: gpuDetail // Modified
                                    });
                                } else {
                                    return res.render('desktop', {
                                        message: 'liste des produits',
                                        produits,
                                        uniqueMarques: uniqueMarques.map(result => result.nommarque),
                                        ramDetails: ramDetails.map(result => result.ram),
                                        stockageDetails: stockageDetail, // Modified
                                        cpuDetails: cpuDetail, // Modified
                                        gpuDetails: gpuDetail // Modified
                                    });
                                }
                            });
                        });
                    });

                });

            });

        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.ecouteur = async (req, res) => {
    console.log(req.body);

    try {
        db.query('SELECT * FROM produits WHERE categorieid = 10', async (error, products) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (products.length === 0) {
                return res.render('vide', {
                    user: req.session.user,
                    message: 'Aucun produit disponible'
                });
            }

            const produits = products; // Changed from results[0] to results
            req.session.produits = produits;

            // Fetch unique marque values
            db.query('SELECT id, nommarque FROM marque WHERE id IN (SELECT DISTINCT marqueid FROM produits WHERE categorieid = 10)', async (error, uniqueMarques) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }

                if (req.session.user) {
                    return res.render('ecouteur', {
                        message: 'liste des produits',
                        user: req.session.user, // Use req.session.user to pass user
                        produits,
                        totalPrixt: req.session.totalPrixt,
                        uniqueMarques: uniqueMarques.map(result => result.nommarque) // Extract unique marque names
                    });
                } else {
                    return res.render('ecouteur', {
                        message: 'liste des produits',
                        produits,
                        uniqueMarques: uniqueMarques.map(result => result.nommarque) // Extract unique marque names
                    });
                }
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.hautparleur = async (req, res) => {
    console.log(req.body);

    try {
        db.query('SELECT * FROM produits WHERE categorieid = 11', async (error, products) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (products.length === 0) {
                return res.render('vide', {
                    user: req.session.user,
                    message: 'Aucun produit disponible'
                });
            }

            const produits = products; // Changed from results[0] to results
            req.session.produits = produits;

            // Fetch unique marque values
            db.query('SELECT id, nommarque FROM marque WHERE id IN (SELECT DISTINCT marqueid FROM produits WHERE categorieid = 11)', async (error, uniqueMarques) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }

                if (req.session.user) {
                    return res.render('hautparleur', {
                        message: 'liste des produits',
                        user: req.session.user, // Use req.session.user to pass user
                        produits,
                        totalPrixt: req.session.totalPrixt,
                        uniqueMarques: uniqueMarques.map(result => result.nommarque) // Extract unique marque names
                    });
                } else {
                    return res.render('hautparleur', {
                        message: 'liste des produits',
                        produits,
                        uniqueMarques: uniqueMarques.map(result => result.nommarque) // Extract unique marque names
                    });
                }
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.ios = async (req, res) => {
    console.log(req.body);

    try {
        db.query('SELECT produits.*, marque.nommarque FROM produits JOIN marque ON produits.marqueid = marque.id WHERE produits.categorieid = 5', async (error, products) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (products.length === 0) {
                return res.render('vide', {
                    user: req.session.user,
                    message: 'Aucun produit disponible'
                });
            }

            const produits = products; // Changed from results[0] to results
            req.session.produits = produits;

            // Fetch unique marque values
            db.query('SELECT id, nommarque FROM marque WHERE id IN (SELECT DISTINCT marqueid FROM produits WHERE categorieid = 5)', async (error, uniqueMarques) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }

                // Fetching distinct RAM values
                db.query('SELECT DISTINCT ram FROM produits WHERE categorieid = 5', async (error, ramDetails) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).send('Internal Server Error');
                    }

                    // Fetching distinct stockage values
                    // Fetching distinct stockage values
                    db.query('SELECT DISTINCT stockage FROM produits WHERE categorieid = 5', async (error, stockageDetails) => {
                        if (error) {
                            console.log(error);
                            return res.status(500).send('Internal Server Error');
                        }

                        const stockageDetail = stockageDetails.map(result => result.stockage);

                        // Fetching distinct ecran values
                        db.query('SELECT DISTINCT ecran FROM produits WHERE categorieid = 5', async (error, ecranDetails) => {
                            if (error) {
                                console.log(error);
                                return res.status(500).send('Internal Server Error');
                            }

                            const ecranDetail = ecranDetails.map(result => result.ecran);

                            // Fetching distinct tailleecran values
                            db.query('SELECT DISTINCT tailleEcran FROM produits WHERE categorieid = 5', async (error, tailleEcranDetails) => {
                                if (error) {
                                    console.log(error);
                                    return res.status(500).send('Internal Server Error');
                                }

                                const tailleEcranDetail = tailleEcranDetails.map(result => result.tailleEcran);

                                // Fetching distinct cpu values
                                db.query('SELECT DISTINCT cpu FROM produits WHERE categorieid = 5', async (error, cpuDetails) => {
                                    if (error) {
                                        console.log(error);
                                        return res.status(500).send('Internal Server Error');
                                    }

                                    const cpuDetail = cpuDetails.map(result => result.cpu);

                                    // Fetching distinct gpu values
                                    db.query('SELECT DISTINCT gpu FROM produits WHERE categorieid = 5', async (error, gpuDetails) => {
                                        if (error) {
                                            console.log(error);
                                            return res.status(500).send('Internal Server Error');
                                        }

                                        const gpuDetail = gpuDetails.map(result => result.gpu);

                                        // Render the page with fetched details
                                        if (req.session.user) {
                                            return res.render('ios', {
                                                message: 'liste des produits',
                                                user: req.session.user,
                                                produits,
                                                uniqueMarques: uniqueMarques.map(result => result.nommarque),
                                                ramDetails: ramDetails.map(result => result.ram),
                                                stockageDetails: stockageDetail, // Modified
                                                ecranDetails: ecranDetail, // Modified
                                                tailleEcranDetails: tailleEcranDetail, // Modified
                                                cpuDetails: cpuDetail, // Modified
                                                gpuDetails: gpuDetail // Modified
                                            });
                                        } else {
                                            return res.render('ios', {
                                                message: 'liste des produits',
                                                produits,
                                                uniqueMarques: uniqueMarques.map(result => result.nommarque),
                                                ramDetails: ramDetails.map(result => result.ram),
                                                stockageDetails: stockageDetail, // Modified
                                                ecranDetails: ecranDetail, // Modified
                                                tailleEcranDetails: tailleEcranDetail, // Modified
                                                cpuDetails: cpuDetail, // Modified
                                                gpuDetails: gpuDetail // Modified
                                            });
                                        }
                                    });
                                });
                            });
                        });
                    });

                });

            });

        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.montre = async (req, res) => {
    console.log(req.body);

    try {
        db.query('SELECT * FROM produits WHERE categorieid = 7', async (error, products) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (products.length === 0) {
                return res.render('vide', {
                    user: req.session.user,
                    message: 'Aucun produit disponible'
                });
            }

            const produits = products; // Changed from results[0] to results
            req.session.produits = produits;

            // Fetch unique marque values
            db.query('SELECT id, nommarque FROM marque WHERE id IN (SELECT DISTINCT marqueid FROM produits WHERE categorieid = 7)', async (error, uniqueMarques) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }

                if (req.session.user) {
                    return res.render('montre', {
                        message: 'liste des produits',
                        user: req.session.user, // Use req.session.user to pass user
                        produits,
                        totalPrixt: req.session.totalPrixt,
                        uniqueMarques: uniqueMarques.map(result => result.nommarque) // Extract unique marque names
                    });
                } else {
                    return res.render('montre', {
                        message: 'liste des produits',
                        produits,
                        uniqueMarques: uniqueMarques.map(result => result.nommarque) // Extract unique marque names
                    });
                }
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.tv = async (req, res) => {
    console.log(req.body);

    try {
        db.query('SELECT produits.*, marque.nommarque FROM produits JOIN marque ON produits.marqueid = marque.id WHERE produits.categorieid = 8', async (error, products) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (products.length === 0) {
                return res.render('vide', {
                    user: req.session.user,
                    message: 'Aucun produit disponible'
                });
            }

            const produits = products; // Changed from results[0] to results
            req.session.produits = produits;

            // Fetch unique marque values
            db.query('SELECT id, nommarque FROM marque WHERE id IN (SELECT DISTINCT marqueid FROM produits WHERE categorieid = 8)', async (error, uniqueMarques) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }

                // Fetching distinct RAM values
                db.query('SELECT DISTINCT ecran FROM produits WHERE categorieid = 8', async (error, ecranDetails) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).send('Internal Server Error');
                    }

                    const ecranDetail = ecranDetails.map(result => result.ecran);

                    // Fetching distinct tailleecran values
                    db.query('SELECT DISTINCT tailleEcran FROM produits WHERE categorieid = 8', async (error, tailleEcranDetails) => {
                        if (error) {
                            console.log(error);
                            return res.status(500).send('Internal Server Error');
                        }

                        const tailleEcranDetail = tailleEcranDetails.map(result => result.tailleEcran);

                        // Fetching distinct cpu values
                        // Render the page with fetched details
                        if (req.session.user) {
                            return res.render('tv', {
                                message: 'liste des produits',
                                user: req.session.user,
                                produits,
                                uniqueMarques: uniqueMarques.map(result => result.nommarque),
                                ecranDetails: ecranDetail,
                                tailleEcranDetails: tailleEcranDetail
                            });
                        } else {
                            return res.render('tv', {
                                message: 'liste des produits',
                                produits,
                                uniqueMarques: uniqueMarques.map(result => result.nommarque),
                                ecranDetails: ecranDetail,
                                tailleEcranDetails: tailleEcranDetail
                            });
                        }
                    });
                });

            });

        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.ecran = async (req, res) => {
    console.log(req.body);

    try {
        db.query('SELECT produits.*, marque.nommarque FROM produits JOIN marque ON produits.marqueid = marque.id WHERE produits.categorieid = 3', async (error, products) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (products.length === 0) {
                return res.render('vide', {
                    user: req.session.user,
                    message: 'Aucun produit disponible'
                });
            }

            const produits = products; // Changed from results[0] to results
            req.session.produits = produits;

            // Fetch unique marque values
            db.query('SELECT id, nommarque FROM marque WHERE id IN (SELECT DISTINCT marqueid FROM produits WHERE categorieid = 3)', async (error, uniqueMarques) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }

                // Fetching distinct RAM values
                db.query('SELECT DISTINCT ecran FROM produits WHERE categorieid = 3', async (error, ecranDetails) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).send('Internal Server Error');
                    }

                    const ecranDetail = ecranDetails.map(result => result.ecran);

                    // Fetching distinct tailleecran values
                    db.query('SELECT DISTINCT tailleEcran FROM produits WHERE categorieid = 3', async (error, tailleEcranDetails) => {
                        if (error) {
                            console.log(error);
                            return res.status(500).send('Internal Server Error');
                        }

                        const tailleEcranDetail = tailleEcranDetails.map(result => result.tailleEcran);

                        // Fetching distinct cpu values
                        // Render the page with fetched details
                        if (req.session.user) {
                            return res.render('ecran', {
                                message: 'liste des produits',
                                user: req.session.user,
                                produits,
                                uniqueMarques: uniqueMarques.map(result => result.nommarque),
                                ecranDetails: ecranDetail,
                                tailleEcranDetails: tailleEcranDetail
                            });
                        } else {
                            return res.render('ecran', {
                                message: 'liste des produits',
                                produits,
                                uniqueMarques: uniqueMarques.map(result => result.nommarque),
                                ecranDetails: ecranDetail,
                                tailleEcranDetails: tailleEcranDetail
                            });
                        }
                    });
                });

            });

        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.produitinfo = async (req, res) => {
    try {
        // Extract the product ID from the query parameters
        const productId = req.query.id;

        // Query the database for the product with the specified ID
        db.query('SELECT produits.*, marque.nommarque FROM produits JOIN marque ON produits.marqueid = marque.id WHERE produits.id = ?', [productId], async (error, productResults) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            // Check if the product with the specified ID exists
            if (productResults.length === 0) {
                return res.render('vide', {
                    message: 'Aucun produit disponible'
                });
            }

            // Product found, get product details
            const product = productResults[0]; // Assuming there's only one product with the given ID

            // Query the database to select reviews and related clients
            db.query('SELECT avis.*, clients.* FROM avis LEFT JOIN clients ON avis.useridc = clients.id WHERE avis.idproduct = ?', [productId], async (error, avisResults) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }

                // Render the product information view with additional details
                return res.render('produitinfo', {
                    message: 'D�tails du produit',
                    user: req.session.user,
                    totalPrixt: req.session.totalPrixt,
                    product,
                    avis: avisResults // Pass the avis results to the view
                });
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.filterproduct = async (req, res) => {
    try {
        // Extract form data from the request body
        const { minprice, maxprice, categorie, ...details } = req.body;

        console.log('Selected checkboxes:', details);

        let sqlQuery = 'SELECT produits.*, marque.nommarque FROM produits INNER JOIN marque ON produits.marqueid = marque.id INNER JOIN categorie ON produits.categorieid = categorie.id WHERE categorie.nomcateg=?';
        let queryParams = [categorie];

        const selectedMarques = [];
        for (const key of Object.keys(details)) {
            // Check if the key starts with 'marque[' and ends with ']'
            if (key.startsWith('marque[') && key.endsWith(']') && details[key] === 'on') {
                // Extract marque name from the key
                const marque = key.substring(7, key.length - 1);
                selectedMarques.push(marque);
                console.log('Selected Marque:', marque);
            }
        }

        // condition for minprice
        if (minprice !== '') {
            sqlQuery += ' AND produits.prix >= ?';
            queryParams.push(parseFloat(minprice));
        }

        // condition for maxprice
        if (maxprice !== '') {
            sqlQuery += ' AND produits.prix <= ?';
            queryParams.push(parseFloat(maxprice));
        }

        // Filter by selected marque if any marque checkbox is selected
        if (selectedMarques.length > 0) {
            console.log('Selected Marques:', selectedMarques);
            const marquePlaceholders = selectedMarques.map(() => '?').join(',');
            sqlQuery += ' AND marque.nommarque IN (' + marquePlaceholders + ')';
            queryParams.push(...selectedMarques);
        }

        // Process RAM checkboxes
        const selectedRAM = [];
        for (const key of Object.keys(details)) {
            // Check if the key starts with 'ram[' and ends with ']'
            if (key.startsWith('ram[') && key.endsWith(']') && details[key] === 'on') {
                // Extract RAM value from the key
                const ram = key.substring(4, key.length - 1);
                selectedRAM.push(ram);
                console.log('Selected RAM:', ram);
            }
        }

        // Filter by selected RAM if any RAM checkbox is selected
        if (selectedRAM.length > 0) {
            console.log('Selected RAM:', selectedRAM);
            const ramPlaceholders = selectedRAM.map(() => '?').join(',');
            sqlQuery += ' AND produits.ram IN (' + ramPlaceholders + ')';
            queryParams.push(...selectedRAM);
        }

        // Process stockage checkboxes
        const selectedStockage = [];
        for (const key of Object.keys(details)) {
            // Check if the key starts with 'stockage[' and ends with ']'
            if (key.startsWith('stockage[') && key.endsWith(']') && details[key] === 'on') {
                // Extract stockage value from the key
                const stockage = key.substring(9, key.length - 1);
                selectedStockage.push(stockage);
                console.log('Selected Stockage:', stockage);
            }
        }

        // Filter by selected stockage if any stockage checkbox is selected
        if (selectedStockage.length > 0) {
            console.log('Selected Stockage:', selectedStockage);
            const stockagePlaceholders = selectedStockage.map(() => '?').join(',');
            sqlQuery += ' AND produits.stockage IN (' + stockagePlaceholders + ')';
            queryParams.push(...selectedStockage);
        }

        // Process ecran checkboxes
        const selectedEcran = [];
        for (const key of Object.keys(details)) {
            // Check if the key starts with 'ecran[' and ends with ']'
            if (key.startsWith('ecran[') && key.endsWith(']') && details[key] === 'on') {
                // Extract ecran value from the key
                const ecran = key.substring(6, key.length - 1);
                selectedEcran.push(ecran);
                console.log('Selected Ecran:', ecran);
            }
        }

        // Filter by selected ecran if any ecran checkbox is selected
        if (selectedEcran.length > 0) {
            console.log('Selected Ecran:', selectedEcran);
            const ecranPlaceholders = selectedEcran.map(() => '?').join(',');
            sqlQuery += ' AND produits.ecran IN (' + ecranPlaceholders + ')';
            queryParams.push(...selectedEcran);
        }

        // Process tailleEcran checkboxes
        const selectedTailleEcran = [];
        for (const key of Object.keys(details)) {
            if (key.startsWith('tailleEcran[') && key.endsWith(']') && details[key] === 'on') {
                const tailleEcran = key.substring(12, key.length - 1);
                selectedTailleEcran.push(tailleEcran);
                console.log('Selected TailleEcran:', tailleEcran);
            }
        }

        // Filter by selected tailleEcran if any tailleEcran checkbox is selected
        if (selectedTailleEcran.length > 0) {
            console.log('Selected TailleEcran:', selectedTailleEcran);
            const tailleEcranPlaceholders = selectedTailleEcran.map(() => '?').join(',');
            sqlQuery += ' AND produits.tailleEcran IN (' + tailleEcranPlaceholders + ')';
            queryParams.push(...selectedTailleEcran);
        }

        const selectedCPU = [];
        for (const key of Object.keys(details)) {
            if (key.startsWith('cpu[') && key.endsWith(']') && details[key] === 'on') {
                const cpu = key.substring(4, key.length - 1);
                selectedCPU.push(cpu);
                console.log('Selected CPU:', cpu);
            }
        }

        // Filter by selected CPU if any CPU checkbox is selected
        if (selectedCPU.length > 0) {
            console.log('Selected CPU:', selectedCPU);
            const cpuPlaceholders = selectedCPU.map(() => '?').join(',');
            sqlQuery += ' AND produits.cpu IN (' + cpuPlaceholders + ')';
            queryParams.push(...selectedCPU);
        }

        const selectedGPU = [];
        for (const key of Object.keys(details)) {
            if (key.startsWith('gpu[') && key.endsWith(']') && details[key] === 'on') {
                const gpu = key.substring(4, key.length - 1);
                selectedGPU.push(gpu);
                console.log('Selected GPU:', gpu);
            }
        }

        // Filter by selected GPU if any GPU checkbox is selected
        if (selectedGPU.length > 0) {
            console.log('Selected GPU:', selectedGPU);
            const gpuPlaceholders = selectedGPU.map(() => '?').join(',');
            sqlQuery += ' AND produits.gpu IN (' + gpuPlaceholders + ')';
            queryParams.push(...selectedGPU);
        }

        // Check if minprice and maxprice are set
        if (minprice && maxprice) {
            sqlQuery += ' AND produits.prix BETWEEN ? AND ?';
            queryParams.push(minprice, maxprice);
        }

        // Add the condition for categorie
        if (categorie) {
            sqlQuery += ' AND categorie.nomcateg = ?';
            queryParams.push(categorie);
            console.log('categorie:', categorie);
        }

        console.log('SQL Query:', sqlQuery);
        console.log('Query Parameters:', queryParams);

        // Execute the SQL query
        db.query(sqlQuery, queryParams, async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }
            console.log('Filtered Produits:', results);
            // Render the filterproduct.hbs page with the filtered products
            return res.render('filterproduct', {
                produits: results, // Pass the filtered products to the view
                user: req.session.user,
                minprice,
                maxprice
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
};



exports.ajouterpanier = async (req, res) => {
    // Extract product id and user id from request query parameters
    const { idproduct, iduser } = req.query;

    // Log the idproduct value to the console
    console.log('Product ID:', idproduct);

    // Check if user id is null in session
    if (!req.session.user || !req.session.user.id) {
        // If user id is null, redirect to connexion page
        return res.render('connexion');
    }

    const userId = req.session.user.id; // Assuming user id is stored in session

    try {
        // Check if user exists in the database
        const userQuery = 'SELECT * FROM clients WHERE id = ?';
        db.query(userQuery, [userId], async (error, userResult) => {
            if (error) {
                console.error('Error checking user existence:', error);
                return res.status(500).send('Internal Server Error');
            }

            // If user does not exist, return an error
            if (userResult.length === 0) {
                return res.render('connexion');
            }

            // Check if the product already exists in the user's cart
            const checkCartQuery = 'SELECT * FROM panier WHERE useridc = ? AND productid = ?';
            db.query(checkCartQuery, [userId, idproduct], async (cartError, cartResult) => {
                if (cartError) {
                    console.error('Error checking cart:', cartError);
                    return res.status(500).send('Internal Server Error');
                }

                // If the product already exists in the cart, return the product information
                if (cartResult.length > 0) {
                    // Fetch product information from the database
                    const productQuery = 'SELECT * FROM produits WHERE id = ?';
                    db.query(productQuery, [idproduct], async (productError, productResult) => {
                        if (productError) {
                            console.error('Error fetching product:', productError);
                            return res.status(500).send('Internal Server Error');
                        }

                        // Return product information to produitinfo
                        return res.render('produitinfo', {
                            product: productResult[0], // Assuming product information is in the first row
                            user: req.session.user,
                            status: 'Produit existe deja dans le panier'
                        });
                    });
                } else {
                    // If the product does not exist in the cart, add it
                    // If the product does not exist in the cart, insert it with a quantity of 1

                    // Fetch product information from the database
                    const productQuery = 'SELECT * FROM produits WHERE id = ?';
                    db.query(productQuery, [idproduct], async (productError, productResult) => {
                        if (productError) {
                            console.error('Error fetching product:', productError);
                            return res.status(500).send('Internal Server Error');
                        }

                        // Get prixu from productResult
                        const prixu = productResult[0].prix;
                        // Calculate prixt based on prixu and quantitep
                        const prixt = prixu * 1;

                        const insertQuery = 'INSERT INTO panier (useridc, productid, quantitep, prixu, prixt) VALUES (?, ?, 1, ?, ?)';
                        db.query(insertQuery, [userId, idproduct, prixu, prixt], async (insertError, insertResult) => {
                            if (insertError) {
                                console.error('Error adding product to cart:', insertError);
                                return res.status(500).send('Internal Server Error');
                            }
                            // Product added to cart successfully
                            console.log('Product added to cart with quantity 1');
                            // Return product information to produitinfo

                            //calculer somme des prix 
                            const sumQuery = 'SELECT SUM(prixt) AS totalPrixt FROM panier WHERE useridc = ?';
                            db.query(sumQuery, [userId], async (error, result) => {
                                if (error) {
                                    console.error('Error calculating total prixt:', error);
                                    return res.status(500).send('Internal Server Error');
                                }
                                const totalPrixt = result[0].totalPrixt;
                                req.session.totalPrixt = totalPrixt

                                return res.render('produitinfo', {
                                    product: productResult[0], // Assuming product information is in the first row
                                    user: req.session.user,
                                    totalPrixt,
                                    status: 'Produit a ete ajoute'
                                });
                            });
                        });
                    });
                }
            });
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
};


exports.panier = async (req, res) => {
    console.log(req.body);
    const userId = req.session.user.id; // Assuming user id is stored in session

    try {
        // Fetch product ids and quantities from the user's cart
        db.query('SELECT panier.productid, panier.quantitep FROM panier WHERE useridc = ?', [userId], async (error, products) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (products.length === 0) {
                return res.render('panier', {
                    message: 'Panier est vide'
                });
            }

            // Extract product ids
            const productIds = products.map(product => product.productid);
            req.session.productIds = productIds;

            // Fetch products based on product ids
            db.query('SELECT produits.*, marque.nommarque, panier.quantitep FROM produits JOIN marque ON produits.marqueid = marque.id JOIN panier ON produits.id = panier.productid WHERE panier.useridc = ?', [userId], async (error, cartProducts) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }

                if (req.session.user) {
                    return res.render('panier', {
                        message: 'Liste des produits',
                        totalPrixt: req.session.totalPrixt,
                        user: req.session.user, // Pass the user data to the view
                        cartProducts // Pass the products in the cart to the view
                    });
                }
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.panierquantite = async (req, res) => {
    const { id, quantite } = req.query;

    try {
        // Update the quantity in the database
        const updateQuery = 'UPDATE panier SET quantitep = ?, prixt = quantitep * prixu WHERE productid = ?';
        db.query(updateQuery, [quantite, id], async (error, updateResult) => {
            if (error) {
                console.error('Error updating quantity in panier:', error);
                return res.status(500).send('Internal Server Error');
            }

            // Check if the update was successful
            if (updateResult.affectedRows > 0) {
                // Retrieve user ID from session
                const userId = req.session.user.id;

                // Fetch product ids from the user's cart
                db.query('SELECT productid FROM panier WHERE useridc = ?', [userId], async (error, products) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).send('Internal Server Error');
                    }

                    if (products.length === 0) {
                        return res.render('panier', {
                            message: 'Panier est vide'
                        });
                    }

                    // Extract product ids
                    const productIds = products.map(product => product.productid);
                    req.session.productIds = productIds;

                    // Fetch products based on product ids
                    db.query('SELECT panier.productid, panier.quantitep FROM panier WHERE useridc = ?', [userId], async (error, products) => {
                        if (error) {
                            console.log(error);
                            return res.status(500).send('Internal Server Error');
                        }

                        if (products.length === 0) {
                            return res.render('panier', {
                                message: 'Panier est vide'
                            });
                        }

                        // Extract product ids
                        const productIds = products.map(product => product.productid);
                        req.session.productIds = productIds;

                        // Fetch products based on product ids
                        db.query('SELECT produits.*, panier.quantitep FROM produits JOIN panier ON produits.id = panier.productid WHERE panier.useridc = ?', [userId], async (error, cartProducts) => {
                            if (error) {
                                console.log(error);
                                return res.status(500).send('Internal Server Error');
                            }

                            if (req.session.user) {
                                //update total prix panier 
                                const sumQuery = 'SELECT SUM(prixt) AS totalPrixt FROM panier WHERE useridc = ?';
                                db.query(sumQuery, [userId], async (error, result) => {
                                    if (error) {
                                        console.error('Error calculating total prixt:', error);
                                        return res.status(500).send('Internal Server Error');
                                    }

                                    // Extract the totalPrixt from the result
                                    const totalPrixt = result[0].totalPrixt;
                                    req.session.totalPrixt = totalPrixt
                                    console.log(totalPrixt);
                                    return res.render('panier', {
                                        message: 'Liste des produits',
                                        user: req.session.user, // Pass the user data to the view
                                        totalPrixt, // en va retourne le somme total des prix
                                        cartProducts // Pass the products in the cart to the view
                                    });
                                });
                                
                            }
                        });
                    });
                });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
};


exports.paniersupprimer = async (req, res) => {
    // Extract product id and user id from request query parameters
    const { idp } = req.query;
    const userId = req.session.user.id;

    try {
        // Check if user exists in the database
        const userQuery = 'SELECT * FROM clients WHERE id = ?';
        db.query(userQuery, [userId], async (error, userResult) => {
            if (error) {
                console.error('Error checking user existence:', error);
                return res.status(500).send('Internal Server Error');
            }

            // If user does not exist, return an error
            if (userResult.length === 0) {
                return res.render('connexion');
            }

            // Delete the item from the cart
            const deleteQuery = 'DELETE FROM panier WHERE useridc = ? AND productid = ?';
            db.query(deleteQuery, [userId, idp], async (deleteError, deleteResult) => {
                if (deleteError) {
                    console.error('Error deleting item from cart:', deleteError);
                    return res.status(500).send('Internal Server Error');
                }

                if (deleteResult.affectedRows === 0) {
                    // No item matching the criteria found in the cart
                    console.log('product nas pas trouvee');
                    console.log('User ID:', userId);
                    console.log('Product ID:', idp);
                    return res.render('panier', {
                        message: 'Produit non trouv� dans le panier'
                    });
                }

                // Item successfully deleted from the cart
                console.log('Item deleted from cart');
                db.query('SELECT panier.productid, panier.quantitep FROM panier WHERE useridc = ?', [userId], async (error, products) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).send('Internal Server Error');
                    }

                    if (products.length === 0) {
                        return res.render('panier', {
                            user: req.session.user,
                            message: 'Panier est vide'
                        });
                    }

                    // Extract product ids
                    const productIds = products.map(product => product.productid);
                    req.session.productIds = productIds;

                    // Fetch products based on product ids
                    db.query('SELECT produits.*, panier.quantitep FROM produits JOIN panier ON produits.id = panier.productid WHERE panier.useridc = ?', [userId], async (error, cartProducts) => {
                        if (error) {
                            console.log(error);
                            return res.status(500).send('Internal Server Error');
                        }

                        if (req.session.user) {
                            return res.render('panier', {
                                message: 'Liste des produits',
                                user: req.session.user, // Pass the user data to the view
                                cartProducts // Pass the products in the cart to the view
                            });
                        }
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.search = async (req, res) => {
    console.log(req.body);

    try {
        const searchQuery = req.query.search; // Extract search query from request query parameters

        let query = `
            SELECT produits.*, marque.nommarque, produits.prix
            FROM produits
            INNER JOIN marque ON produits.marqueid = marque.id
        `;

        // Check if there's a search query
        if (searchQuery) {
            // Add a WHERE clause to filter products by marque and model
            query += ` WHERE marque.nommarque LIKE '%${searchQuery}%' OR produits.model LIKE '%${searchQuery}%'`;
        }

        db.query(query, async (error, results) => {
            if (error) {
                console.log('Database error:', error);
                return res.status(500).send('Internal Server Error');
            }

            // Log the results to debug
            console.log('Query results:', results);

            if (results.length === 0) {
                return res.render('vide', {
                    user: req.session.user,
                    message: 'Aucun produit disponible'
                });
            }

            const produits = results.map(row => ({
                id: row.id,
                nommarque: row.nommarque,
                model: row.model,
                prix: row.prix, // Include the prix field
                reference: row.reference // Include the entire row for reference
                // add other fields as necessary
            }));

            req.session.produits = produits;

            const responseData = {
                message: 'liste des produits',
                produits
            };

            if (req.session.user) {
                responseData.user = req.session.user;
            }

            return res.render('ios', responseData);
        });
    } catch (error) {
        console.log('Server error:', error);
        return res.status(500).send('Internal Server Error');
    }
};


exports.ajoutercommande = async (req, res) => {
    console.log(req.body);

    try {
        // Define the user ID
        const userId = req.session.user.id;
        const { typedepaiement } = req.query;
        // Define the commande ID
        let commandeid = 0;

        // Check if a commande exists for the user
        const selectCommandeQuery = 'SELECT id FROM commande WHERE useridc = ?';
        const existingCommande = await queryAsync(selectCommandeQuery, [userId]);

        if (existingCommande.length > 0) {
            // If a commande already exists, use its id
            commandeid = existingCommande[0].id;
        } else {
            // If no commande exists, create a new one
            const insertCommandeQuery = 'INSERT INTO commande (useridc, date) VALUES (?, NOW())';
            const newCommandeResult = await queryAsync(insertCommandeQuery, [userId]);
            commandeid = newCommandeResult.insertId;
        }

        // Insert into commandeligne using a join query with a check for duplicate products
        const insertCommandeligneQuery = `
            INSERT INTO commandeligne (commandeid, quantite, produitid, prix)
            SELECT ?, p.quantitep, p.productid, p.prixu
            FROM panier p
            JOIN commande c ON c.useridc = p.useridc
            WHERE c.useridc = ?
            AND NOT EXISTS (
                SELECT 1
                FROM commandeligne cl
                WHERE cl.commandeid = ?
                AND cl.produitid = p.productid
            );
        `;
        await queryAsync(insertCommandeligneQuery, [commandeid, userId, commandeid]);

        // Calculate total quantity for the commande from commandeligne
        const totalQuantiteQuery = `
            SELECT SUM(quantite) AS totalQuantite
            FROM commandeligne
            WHERE commandeid = ?
        `;
        const [totalQuantiteResult] = await queryAsync(totalQuantiteQuery, [commandeid]);
        const totalQuantite = totalQuantiteResult.totalQuantite;

        // Update the quantite column in the commande table
        const updateCommandeQuantiteQuery = `
            UPDATE commande
            SET quantite = ?
            WHERE id = ?
        `;
        await queryAsync(updateCommandeQuantiteQuery, [totalQuantite, commandeid]);

        // Calculate totalcl for each row in commandeligne
        const updateCommandeligneQuery = `
            UPDATE commandeligne
            SET totalcl = quantite * prix
            WHERE commandeid = ?
        `;
        await queryAsync(updateCommandeligneQuery, [commandeid]);

        // Calculate totalprix for the commande
        const totalprixQuery = `
            SELECT SUM(totalcl) AS totalprix
            FROM commandeligne
            WHERE commandeid = ?
        `;
        const [totalprixResult] = await queryAsync(totalprixQuery, [commandeid]);
        const totalprix = totalprixResult.totalprix;

        // Update total in commande
        const updateCommandeQuery = `
            UPDATE commande
            SET total = ?
            WHERE id = ?
        `;
        await queryAsync(updateCommandeQuery, [totalprix, commandeid]);

        // Delete products from panier after placing the commandes
        const deleteFromPanierQuery = 'DELETE FROM panier WHERE useridc = ?';
        await queryAsync(deleteFromPanierQuery, [userId]);

        db.query('UPDATE commande SET typedepaiement = ? WHERE useridc = ?', [typedepaiement, userId], async (error, result) => {
            if (error) {
                console.error('Error updating typedepaiement:', error);
                return res.status(500).send('Internal Server Error');
            }

            // Redirect based on the value of typedepaiement
            if (typedepaiement === 'espece') {
                // Return a response or render a view as needed
                return res.render('gotocommande', {
                    user: req.session.user,
                    totalPrixt: req.session.totalPrixt
                });
            } else if (typedepaiement === 'cheque') {
                return res.render('formulairedepaiement', {
                    user: req.session.user,
                    totalPrixt: req.session.totalPrixt
                });
            } else {
                // Handle other types of payment if needed
                console.log('type de paiement=',typedepaiement);
                return res.status(400).send('Invalid typedepaiement');
            }
        });

        

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal Server Error');
    }

    // Promise wrapper for db.query
    function queryAsync(sql, params) {
        return new Promise((resolve, reject) => {
            db.query(sql, params, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }
};

exports.commande = async (req, res) => {
    console.log(req.body);
    const userId = req.session.user.id; // Assuming user id is stored in session

    try {
        // Fetch the commande ID for the user
        db.query('SELECT id FROM commande WHERE useridc = ?', [userId], async (commandeError, commandeResult) => {
            if (commandeError) {
                console.error(commandeError);
                return res.status(500).send('Internal Server Error');
            }

            // Check if a commande was found
            if (commandeResult && commandeResult.length > 0) {
                const idcommande = commandeResult[0].id;

                console.log('Commande ID:', idcommande);

                //recevoir le numero du commande****************************************
                req.session.idcommande = idcommande;
                // Calculate totalquantite and totalprix
                db.query(`
                    SELECT SUM(totalcl) AS totalprix
                    FROM commandeligne
                    WHERE commandeid = ?
                `, [idcommande], async (sumError, sumResult) => {
                    if (sumError) {
                        console.error(sumError);
                        return res.status(500).send('Internal Server Error');
                    }

                    const totalprix = sumResult[0].totalprix;

                    console.log('Total Price:', totalprix);

                    // Update the commande with totalquantite, totalprix, and total
                    db.query(`
                        UPDATE commande
                        SET total = ?
                        WHERE id = ?
                    `, [totalprix, idcommande], async (updateError, updateResult) => {
                        if (updateError) {
                            console.error(updateError);
                            return res.status(500).send('Internal Server Error');
                        }

                        console.log('Commande updated:', updateResult.affectedRows);

                        //update total prix pour chaque ligne de commande :
                        db.query(`
                            SELECT quantite, prix
                            FROM commandeligne
                            WHERE commandeid = ?
                        `, [idcommande], async (error, results) => {
                            if (error) {
                                console.error(error);
                                return res.status(500).send('Internal Server Error');
                            }

                            // Calculate totalcl for each row
                            for (const row of results) {
                                const { quantite, prix } = row;
                                const totalcl = quantite * prix;

                                // Update the totalcl field for each row
                                await db.query(`
                                    UPDATE commandeligne
                                    SET totalcl = ?
                                    WHERE commandeid = ? AND quantite = ? AND prix = ?
                                `, [totalcl, idcommande, quantite, prix]);
                            }

                            console.log('Totalcl updated successfully.');
                            // Handle further operations or return a response as needed
                        });
                        
                        // Fetch commandes for the user
                        db.query(`
                            SELECT c.*, cl.*, p.*, m.*
                            FROM commande c
                            JOIN commandeligne cl ON c.id = cl.commandeid
                            JOIN produits p ON cl.produitid = p.id
                            JOIN marque m ON p.marqueid = m.id
                            WHERE c.useridc = ?
                        `, [userId], async (fetchError, commandes) => {
                            if (fetchError) {
                                console.error(fetchError);
                                return res.status(500).send('Internal Server Error');
                            }
                            // Render the view with the fetched commandes
                            if (commandes && commandes.length > 0) {

                                db.query('SELECT total FROM commande WHERE useridc = ?', [userId], (error, results) => {
                                    if (error) {
                                        console.error('Error selecting total from commande:', error);
                                        // Handle the error
                                        return;
                                    }

                                    // If there are no results, handle accordingly
                                    if (results.length === 0) {
                                        console.log('No total found for the user.');
                                        // Handle the case where no total is found
                                        return;
                                    }

                                    // Extract the total from the first result
                                    const total = results[0].total;

                                    // Now you can use the total as needed
                                    console.log('Total:', total);
                                });
                                db.query('SELECT status FROM commande WHERE useridc = ?', [userId], (error, results) => {
                                    if (error) {
                                        console.error('Error selecting status from commande:', error);
                                        // Handle the error
                                        return;
                                    }

                                    // If there are no results, handle accordingly
                                    if (results.length === 0) {
                                        console.log('No status found for the user.');
                                        // Handle the case where no status is found
                                        return;
                                    }

                                    // Extract the status from the first result
                                    const status = results[0].status;
                                    req.session.status = status;
                                    // Now you can use the status as needed
                                    console.log('Status:', status);
                                });

                                return res.render('moncommande', {
                                    message: 'Liste des produits',
                                    totalPrixt: req.session.totalPrixt,
                                    user: req.session.user,
                                    idcommande: req.session.idcommande,
                                    commandes,
                                    status: req.session.status,
                                    totalprix
                                });
                            } else {
                                return res.render('panier', {
                                    message: 'Aucun commande'
                                });
                            }
                        });
                    });
                });
            } else {
                console.error('No commande found for the user.');
                return res.render('panier', {
                    message: 'Aucun commande'
                });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.supprimercommande = async (req, res) => {
    try {
        // Retrieve the commande ID from the form
        const commandeId = req.query.idcommande;

        // Delete entries from commandeligne table where commandeid matches idcommande
        db.query('DELETE FROM commandeligne WHERE commandeid = ?', [commandeId], async (error1, results1) => {
            if (error1) {
                console.error('Error deleting entries from commandeligne:', error1);
                return res.status(500).send('Internal Server Error');
            }

            console.log('Entries deleted from commandeligne:', results1.affectedRows);

            // Delete entry from commande table where id matches idcommande
            db.query('DELETE FROM commande WHERE id = ?', [commandeId], async (error2, results2) => {
                if (error2) {
                    console.error('Error deleting entry from commande:', error2);
                    return res.status(500).send('Internal Server Error');
                }

                console.log('Entry deleted from commande:', results2.affectedRows);

                // Redirect to the admincommandes page after deletion
                return res.redirect('/con/panier');
            });
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.home = async (req, res) => {

    try {
        return res.render('index', {
            user: req.session.user,
            totalPrixt: req.session.totalPrixt,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.typedepaiement = async (req, res) => {
    const userId = req.session.user.id;
    const { typedepaiement } = req.query;

    try {
        // Update the commande table with the specified typedepaiement
        db.query('UPDATE commande SET typedepaiement = ? WHERE useridc = ?', [typedepaiement, userId], async (error, result) => {
            if (error) {
                console.error('Error updating typedepaiement:', error);
                return res.status(500).send('Internal Server Error');
            }

            // Redirect based on the value of typedepaiement
            if (typedepaiement === 'espece') {
                return res.redirect('/gotocommande');
            } else if (typedepaiement === 'cheque') {
                return res.redirect('/formulairedepaiement');
            } else {
                // Handle other types of payment if needed
                return res.status(400).send('Invalid typedepaiement');
            }
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.ajouteravis = async (req, res) => {
    try {
        const { avis, rating } = req.query;
        const userId = req.session.user.id;
        const productId = req.query.id; // Assuming id is sent in the query parameters

        // Insert review into database
        db.query('INSERT INTO avis (useridc, idproduct, avis, stars) VALUES (?, ?, ?, ?)', [userId, productId, avis, rating], (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }
            // Redirect to /con/productinfo with the product ID as a query parameter
            res.redirect(`/con/productinfo?id=${productId}`);
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.gererprofilc = async (req, res) => {
    const userId = req.query.id;

    try {
        db.query('SELECT * FROM clients WHERE id = ?', [userId], async (error, clientResults) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            // Check if the product with the specified ID exists
            if (clientResults.length === 0) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            // Product found, get product details
            const client = clientResults[0]; // Assuming there's only one product with the given ID

            return res.render('gererprofilcform', {
                user: req.session.user,
                totalPrixt: req.session.totalPrixt,
                client
            });
        });
    } catch (error) {
        console.error('Error retrieving client data:', error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.gererprofilcok = async (req, res) => {
    const { id, nom, prenom, email, adresse, tel, password, passwordConfirm } = req.body;

    try {
        let message;

        // Check if passwords match
        if (password !== passwordConfirm) {
            message = 'Passwords do not match';
        } else {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 8);

            // Perform the database update operation with hashed password
            await db.query('UPDATE clients SET nom=?, prenom=?, email=?, adresse=?, tel=?, password=? WHERE id=?',
                [nom, prenom, email, adresse, tel, hashedPassword, id]);

            message = 'Client information updated successfully';
        }

        // Fetch client data
        const userId = req.body.id;
        console.log('id = ', userId);
        console.log('message =', message);
        db.query('SELECT * FROM clients WHERE id = ?', [userId], async (error, clientResults) => {
            if (error) {
                console.error('Error retrieving client data:', error);
                return res.status(500).send('Internal Server Error');
            }

            // Check if the client with the specified ID exists
            if (clientResults.length === 0) {
                console.error('Client not found');
                return res.status(500).send('Internal Server Error');
            }

            // Client found, get client details
            const client = clientResults[0]; // Assuming there's only one client with the given ID

            // Render the gererprofilcform page with the message and client details
            return res.render('gererprofilcform', {
                message,
                user: req.session.user,
                totalPrixt: req.session.totalPrixt,
                client
            });
        });
    } catch (error) {
        console.error('Error updating client information:', error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.supprimerprofilc = async (req, res) => {
    try {
        // Retrieve the product ID from the request
        const clientId = req.query.id;

        console.log('Client ID:', clientId);

        // Query to delete the product based on its ID
        db.query('DELETE FROM clients WHERE id = ?', [clientId], async (error, results) => {
            if (error) {
                console.log('Error deleting client:', error);
                return res.status(500).send('Internal Server Error');
            }
            console.log('Client deleted successfully:', results);

            db.query('SELECT id FROM commande WHERE useridc = ?', [clientId], async (error, results) => {
                if (error) {
                    console.log('Error selecting id from commande:', error);
                    return res.status(500).send('Internal Server Error');
                }

                // Extracting the id from the results
                const commandId = results[0].id;

                // Second query to delete from commandeligne where commandeid = id(commande)
                db.query('DELETE FROM commandeligne WHERE commandeid = ?', [commandId], async (error, results) => {
                    if (error) {
                        console.log('Error deleting from commandeligne:', error);
                        return res.status(500).send('Internal Server Error');
                    }
                    console.log('Commandeligne deleted successfully:', results);

                    // Third query to delete from commande where useridc = ?
                    db.query('DELETE FROM commande WHERE useridc = ?', [clientId], async (error, results) => {
                        if (error) {
                            console.log('Error deleting commandes:', error);
                            return res.status(500).send('Internal Server Error');
                        }
                        console.log('Commande deleted successfully:', results);

                        // Redirect to the adminproducts page after deletion
                        return res.redirect('/');
                    });
                });
            });
        });
    } catch (error) {
        console.log('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.adminaddproduct = async (req, res) => {
    try {
        // Query to select marque.nommarque and marque.id
        const marques = await new Promise((resolve, reject) => {
            const marqueQuery = `
                SELECT DISTINCT marque.id, marque.nommarque
                FROM marque
            `;
            db.query(marqueQuery, (error, results) => {
                if (error) {
                    console.error(error);
                    reject('Error retrieving marques');
                } else {
                    resolve(results);
                }
            });
        });

        // Query to select all columns from categorie and produits tables
        const categories = await new Promise((resolve, reject) => {
            const categorieQuery = `
                SELECT DISTINCT categorie.*
                FROM categorie
                WHERE id IN (6, 7, 9, 10, 11)
            `;
            db.query(categorieQuery, (error, results) => {
                if (error) {
                    console.error(error);
                    reject('Error retrieving categories');
                } else {
                    resolve(results);
                }
            });
        });

        // Render the adminaddproduct.hbs template with marques and categories data
        return res.render('adminaddproduct', {
            message: 'Liste des produits',
            marques,
            categories,
            useradmin: req.session.useradmin
        });
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.adminaddproductinfo = async (req, res) => {
    try {
        // Query to select marque.nommarque and marque.id
        const marques = await new Promise((resolve, reject) => {
            const marqueQuery = `
                SELECT DISTINCT marque.id, marque.nommarque
                FROM marque
            `;
            db.query(marqueQuery, (error, results) => {
                if (error) {
                    console.error(error);
                    reject('Error retrieving marques');
                } else {
                    resolve(results);
                }
            });
        });

        // Query to select all columns from categorie and produits tables
        const categories = await new Promise((resolve, reject) => {
            const categorieQuery = `
                SELECT DISTINCT categorie.*
                FROM categorie
                WHERE id IN (1, 2, 4, 5)
            `;
            db.query(categorieQuery, (error, results) => {
                if (error) {
                    console.error(error);
                    reject('Error retrieving categories');
                } else {
                    resolve(results);
                }
            });
        });

        // Render the adminaddproduct.hbs template with marques and categories data
        return res.render('adminaddproductinfo', {
            message: 'Liste des produits',
            marques,
            categories,
            useradmin: req.session.useradmin
        });
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.adminaddproductecran = async (req, res) => {
    try {
        // Query to select marque.nommarque and marque.id
        const marques = await new Promise((resolve, reject) => {
            const marqueQuery = `
                SELECT DISTINCT marque.id, marque.nommarque
                FROM marque
            `;
            db.query(marqueQuery, (error, results) => {
                if (error) {
                    console.error(error);
                    reject('Error retrieving marques');
                } else {
                    resolve(results);
                }
            });
        });

        // Query to select all columns from categorie and produits tables
        const categories = await new Promise((resolve, reject) => {
            const categorieQuery = `
                SELECT DISTINCT categorie.*
                FROM categorie
                WHERE id IN (3, 8)
            `;
            db.query(categorieQuery, (error, results) => {
                if (error) {
                    console.error(error);
                    reject('Error retrieving categories');
                } else {
                    resolve(results);
                }
            });
        });

        // Render the adminaddproduct.hbs template with marques and categories data
        return res.render('adminaddproductecran', {
            message: 'Liste des produits',
            marques,
            categories,
            useradmin: req.session.useradmin
        });
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.adminaddproductok = async (req, res) => {
    const { reference, model, description, quantite, prix, categorieId, marqueId } = req.query;

    try {
        // Insert data into produits table including marqueId and categorieId
        await db.query('INSERT INTO produits (reference, model, description, quantite, prix, categorieid, marqueid) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [reference, model, description, quantite, prix, categorieId, marqueId]);

        // Fetch updated products data
        const produits = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM produits', (error, results) => {
                if (error) {
                    console.error(error);
                    reject('Error retrieving products');
                } else {
                    resolve(results);
                }
            });
        });

        // Set the session produits
        req.session.produits = produits;

        // Render the adminproducts.hbs template with the products data
        return res.render('adminproducts', {
            message: 'Liste des produits',
            produits,
            useradmin: req.session.useradmin
        });
    } catch (error) {
        console.error('Error inserting data into produits:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.adminaddproductecranok = async (req, res) => {
    const { reference, model, description, quantite, prix, tailleEcran, ecran, categorieId, marqueId } = req.query;

    try {
        // Insert data into produits table
        await db.query('INSERT INTO produits (reference, model, description, quantite, prix, tailleEcran, ecran, categorieId, marqueId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [reference, model, description, quantite, prix, tailleEcran, ecran, categorieId, marqueId]);

        // Fetch updated products data
        const produits = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM produits', (error, results) => {
                if (error) {
                    console.log(error);
                    reject('Internal Server Error');
                } else {
                    resolve(results);
                }
            });
        });

        // Set the session produits
        req.session.produits = produits;

        // Render the adminproducts.hbs template with the products data
        return res.render('adminproducts', {
            message: 'Liste des produits',
            produits,
            useradmin: req.session.useradmin
        });
    } catch (error) {
        console.error('Error inserting data into produits:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.adminaddproductinfook = async (req, res) => {
    const { reference, model, description, quantite, prix, tailleEcran, ecran, ram, stockage, cpu, gpu, categorieId, marqueId } = req.query;

    try {
        // Insert data into produits table
        await db.query('INSERT INTO produits (reference, model, description, quantite, prix, tailleEcran, ecran, ram, stockage, cpu, gpu, categorieId, marqueId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [reference, model, description, quantite, prix, tailleEcran, ecran, ram, stockage, cpu, gpu, categorieId, marqueId]);

        // Fetch updated products data
        const produits = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM produits', (error, results) => {
                if (error) {
                    console.log(error);
                    reject('Internal Server Error');
                } else {
                    resolve(results);
                }
            });
        });

        // Set the session produits
        req.session.produits = produits;

        // Render the adminproducts.hbs template with the products data
        return res.render('adminproducts', {
            message: 'Liste des produits',
            produits,
            useradmin: req.session.useradmin
        });
    } catch (error) {
        console.error('Error inserting data into produits:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.adminaddmarque = async (req, res) => {
    try {
        return res.render('adminaddmarque', {
            useradmin: req.session.useradmin
        });
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.adminaddmarqueok = async (req, res) => {
    const { nommarque } = req.query;

    try {
        // Check if the marque already exists
        const existingMarque = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM marque WHERE nommarque = ?', [nommarque], (error, results) => {
                if (error) {
                    console.error(error);
                    reject('Error checking existing marque');
                } else {
                    resolve(results[0]); // Get the first result
                }
            });
        });

        // If marque exists, return to adminaddmarque page
        if (existingMarque) {
            return res.render('adminaddmarque', {
                message: 'La marque existe deja',
                useradmin: req.session.useradmin
            });
        }

        // If marque doesn't exist, insert it into the database
        await new Promise((resolve, reject) => {
            db.query('INSERT INTO marque (nommarque) VALUES (?)', [nommarque], (error) => {
                if (error) {
                    console.error(error);
                    reject('Error inserting new marque');
                } else {
                    resolve();
                }
            });
        });

        // Return to adminaddproduct page with success message
        return res.render('adminaddmarque', {
            message: 'La marque a ete ajoutee',
            useradmin: req.session.useradmin
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.adminaddcateg = async (req, res) => {
    try {
        return res.render('adminaddcateg', {
            useradmin: req.session.useradmin
        });
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.adminaddcategok = async (req, res) => {
    const { nomcateg } = req.query;

    try {
        // Check if the category already exists
        const existingCategory = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM categorie WHERE nomcateg = ?', [nomcateg], (error, results) => {
                if (error) {
                    console.error(error);
                    reject('Error checking existing category');
                } else {
                    resolve(results[0]); // Get the first result
                }
            });
        });

        // If category exists, return to adminaddproduct page
        if (existingCategory) {
            return res.render('adminaddcateg', {
                message: 'La categorie existe deja',
                useradmin: req.session.useradmin
            });
        }

        // If category doesn't exist, insert it into the database
        await new Promise((resolve, reject) => {
            db.query('INSERT INTO categorie (nomcateg) VALUES (?)', [nomcateg], (error) => {
                if (error) {
                    console.error(error);
                    reject('Error inserting new category');
                } else {
                    resolve();
                }
            });
        });

        // Return to adminaddproduct page with success message
        return res.render('adminaddcateg', {
            message: 'La categorie a ete ajoutee',
            useradmin: req.session.useradmin
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.deletecateg = async (req, res) => {
    try {
        // Retrieve the product ID from the request
        const categId = req.query.id;

        console.log('Product ID:', categId);

        // Query to delete the product based on its ID
        db.query('DELETE FROM categorie WHERE id = ?', [categId], async (error, results) => {
            if (error) {
                console.log('Error deleting product:', error);
                return res.status(500).send('Internal Server Error');
            }

            console.log('Product deleted successfully:', results);

            // Redirect to the adminproducts page after deletion
            return res.redirect('/con/admincategorie');
        });
    } catch (error) {
        console.log('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.deletecommande = async (req, res) => {
    try {
        // Retrieve the product ID from the request
        const comId = req.query.id;

        console.log('commande ID:', comId);

        // Query to delete the product based on its ID
        db.query('DELETE FROM commande WHERE id = ?', [comId], async (error, results) => {
            if (error) {
                console.log('Error deleting product:', error);
                return res.status(500).send('Internal Server Error');
            }

            console.log('Product deleted successfully:', results);

            // Redirect to the adminproducts page after deletion
            return res.redirect('/con/admincommandes');
        });
    } catch (error) {
        console.log('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.deleteuser = async (req, res) => {
    try {
        // Retrieve the product ID from the request
        const userId = req.query.id;

        console.log('Product ID:', userId);

        // Query to delete the product based on its ID
        db.query('DELETE FROM clients WHERE id = ?', [userId], async (error, results) => {
            if (error) {
                console.log('Error deleting client:', error);
                return res.status(500).send('Internal Server Error');
            }

            console.log('client deleted successfully:', results);

            // Redirect to the adminproducts page after deletion
            return res.redirect('/con/adminmembres');
        });
    } catch (error) {
        console.log('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.apropos = async (req, res) => {
    console.log(req.body);

    try {
        if (req.session.user) {
            return res.render('apropos', {
                user: req.session.user
            });
        } else {
            return res.render('apropos', {
                message: 'a propos de nous'
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.indexproduct = async (req, res) => {
    try {
        const marque = req.query.marque;
        console.log('Selected marque:', marque);

        // Define the SQL query to filter products by marque.nommarque
        const sqlQuery = 'SELECT produits.*, marque.nommarque FROM produits JOIN marque ON produits.marqueid = marque.id WHERE marque.nommarque = ?';
        db.query(sqlQuery, [marque], async (error, products) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Internal Server Error');
            }

            if (products.length === 0) {
                return res.render('vide', {
                    user: req.session.user,
                    message: 'Aucun produit disponible'
                });
            }

            const produits = products; // Changed from results[0] to results
            req.session.produits = produits;

            // Fetch unique marque values
            db.query('SELECT id, nommarque FROM marque WHERE id IN (SELECT DISTINCT marqueid FROM produits)', async (error, uniqueMarques) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Internal Server Error');
                }

                // Fetching distinct RAM values
                db.query('SELECT DISTINCT ram FROM produits', async (error, ramDetails) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).send('Internal Server Error');
                    }

                    // Fetching distinct stockage values
                    db.query('SELECT DISTINCT stockage FROM produits', async (error, stockageDetails) => {
                        if (error) {
                            console.log(error);
                            return res.status(500).send('Internal Server Error');
                        }

                        const stockageDetail = stockageDetails.map(result => result.stockage);

                        // Fetching distinct ecran values
                        db.query('SELECT DISTINCT ecran FROM produits', async (error, ecranDetails) => {
                            if (error) {
                                console.log(error);
                                return res.status(500).send('Internal Server Error');
                            }

                            const ecranDetail = ecranDetails.map(result => result.ecran);

                            // Fetching distinct tailleEcran values
                            db.query('SELECT DISTINCT tailleEcran FROM produits', async (error, tailleEcranDetails) => {
                                if (error) {
                                    console.log(error);
                                    return res.status(500).send('Internal Server Error');
                                }

                                const tailleEcranDetail = tailleEcranDetails.map(result => result.tailleEcran);

                                // Fetching distinct cpu values
                                db.query('SELECT DISTINCT cpu FROM produits', async (error, cpuDetails) => {
                                    if (error) {
                                        console.log(error);
                                        return res.status(500).send('Internal Server Error');
                                    }

                                    const cpuDetail = cpuDetails.map(result => result.cpu);

                                    // Fetching distinct gpu values
                                    db.query('SELECT DISTINCT gpu FROM produits', async (error, gpuDetails) => {
                                        if (error) {
                                            console.log(error);
                                            return res.status(500).send('Internal Server Error');
                                        }

                                        const gpuDetail = gpuDetails.map(result => result.gpu);

                                        // Render the page with fetched details
                                        return res.render('filterindexproduct', {
                                            message: 'liste des produits',
                                            user: req.session.user,
                                            produits,
                                            uniqueMarques: uniqueMarques.map(result => result.nommarque),
                                            ramDetails: ramDetails.map(result => result.ram),
                                            stockageDetails: stockageDetail,
                                            ecranDetails: ecranDetail,
                                            tailleEcranDetails: tailleEcranDetail,
                                            cpuDetails: cpuDetail,
                                            gpuDetails: gpuDetail
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
};

