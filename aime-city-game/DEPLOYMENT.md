# Mettre AIME® CITY en ligne

## Recommandation : une bêta privée sur Railway

Héberger **le service Next.js et une base PostgreSQL dans le même projet Railway**. Choisir une région européenne pour les deux services si vos utilisateurs sont principalement en France/UE.

Le lien de prévisualisation du sandbox sert aux essais. Ce n'est pas un hébergement de production dont la disponibilité, les sauvegardes ou la conservation de la base seraient garanties.

**Cette préparation ne déploie rien dans votre compte Railway.** Il faut y connecter le dépôt et configurer les variables. Aucun compte hébergeur, domaine ou abonnement n'est créé automatiquement.

## Ce que cette version sauvegarde réellement

| Données | Stockage actuel |
| --- | --- |
| Couple, équipe, missions, budget, calendrier, préférences, brouillons ARIA | Navigateur de l'appareil : IndexedDB + localStorage |
| Photos ajoutées à la partie | Navigateur ; celles incluses dans un mini-site sont aussi envoyées lors de sa publication |
| Mini-site publié | PostgreSQL, table `wedding_sites` |
| RSVP envoyé depuis une page `/s/[code]` | PostgreSQL, table `guest_rsvps` |
| RSVP saisi dans l'aperçu invité de l'application | Partie locale uniquement |

Une partie n'est **pas automatiquement synchronisée** entre iPhone, ordinateur, navigateurs ou domaines. Le panneau « Réponses locales » montre les RSVP saisis dans l'app ; les réponses envoyées depuis un mini-site publié sont affichées à côté, via `GET /api/share/[code]`. Une remise à zéro locale ne supprime pas les mini-sites ou RSVP déjà publiés.

## 1. Préserver votre partie et récupérer le code

1. Dans l'aperçu actuel, ouvrir **Réglages → Exporter JSON** et conserver le fichier dans un endroit privé.
2. Récupérer le code source du projet depuis votre outil de développement.
3. Créer un dépôt GitHub privé et y envoyer le projet.
4. Inclure `src/`, `public/images/`, `scripts/`, `drizzle/`, `package.json`, `package-lock.json`, `.node-version`, `railway.toml`, `drizzle.deploy.config.ts` et les fichiers de configuration Next.js/TypeScript.
5. **Ne jamais envoyer `.env`, mots de passe ou URL de connexion réelle.** Le `.gitignore` fourni les exclut. S'ils étaient déjà suivis par Git, les retirer de l'historique et renouveler les secrets compromis.

Ne pas confondre le fichier JSON de sauvegarde avec le code source : les deux sont nécessaires pour retrouver le projet et votre partie.

## 2. Créer l'hébergement

1. Sur [Railway](https://railway.com/), créer un projet et choisir **Deploy from GitHub repo**.
2. Sélectionner le dépôt AIME CITY.
3. Dans le même projet, choisir **New → Database → PostgreSQL**.
4. Garder PostgreSQL sur le réseau privé : aucun accès public à la base n'est nécessaire pour le service web ou les migrations.
5. Garder un seul réplica du service web pour cette première bêta.

Le premier essai de déploiement peut échouer tant que les variables ne sont pas ajoutées : cela est normal, il suffit ensuite de redéployer.

## 3. Configurer les variables du service web

Dans le service **Next.js**, ouvrir **Variables** :

| Variable | Valeur à fournir |
| --- | --- |
| `DATABASE_URL` | **Add Reference Variable → service PostgreSQL → DATABASE_URL**. Ne pas utiliser l'URL locale du sandbox. |
| `AIME_PRIVATE_ACCESS` | `true` pour cette première mise en ligne |
| `AIME_PRIVATE_USERNAME` | Votre identifiant de bêta, par exemple `aime` ; sans caractère `:` |
| `AIME_PRIVATE_PASSWORD` | Mot de passe unique, aléatoire, d'au moins 24 caractères, créé dans un gestionnaire de mots de passe |
| `APP_URL` | L'adresse HTTPS finale, sans chemin, après génération du domaine |
| `NEXT_TELEMETRY_DISABLED` | `1` (facultatif) |

Ne pas préfixer les secrets par `NEXT_PUBLIC_`. Ne pas copier `.env.example` sans remplacer ses valeurs fictives.

Railway fournit `PORT` automatiquement. `.node-version` demande Node.js 22. Si la détection de version de votre environnement l'exige, définir `RAILPACK_NODE_VERSION` sur `22` dans le service.

### Comment fonctionne l'accès privé

`src/proxy.ts` demande des identifiants HTTP Basic via le navigateur. Sur Railway, cet accès est privé par défaut même si `AIME_PRIVATE_ACCESS` est absent. Sans mot de passe valide configuré, l'accès reste fermé. Les pages et les API, y compris publication et RSVP, sont protégées ; `/api/health` reste accessible pour le contrôle de santé sans exposer de donnée de mariage.

**Utiliser uniquement l'URL HTTPS fournie par l'hébergeur.** Cette protection est un verrou de bêta, pas des comptes individuels. Toutes les personnes à qui vous communiquez le même mot de passe ont les mêmes droits. Ne pas communiquer ces identifiants à des invités ou à des clients.

## 4. Créer les tables et démarrer

Le fichier `railway.toml` contient déjà les réglages :

| Étape | Commande |
| --- | --- |
| Construction | `npm run build` |
| Pré-déploiement | `npx tsx scripts/migrate.ts` |
| Démarrage | `npm run start -- --hostname 0.0.0.0` |
| Healthcheck | `/api/health` |

La pré-commande applique les migrations versionnées de `drizzle/` avant de démarrer le nouveau serveur. La migration initiale crée `wedding_sites` et `guest_rsvps` ; le journal Drizzle empêche de la rejouer aux déploiements suivants.

**Important : cette migration initiale vise une base neuve.** Si une base possède déjà ces tables, notamment celle du sandbox créée via `drizzle-kit push`, ne pas lancer aveuglément la migration. Faire une sauvegarde, examiner son schéma puis établir une référence de migration adaptée. Ne pas supprimer des tables pour contourner une erreur.

`drizzle.config.json` reste la configuration du sandbox. En dehors du sandbox, utiliser `drizzle.deploy.config.ts`, qui lit `DATABASE_URL` au lieu d'une adresse locale codée en dur.

## 5. Obtenir l'URL et connecter un domaine

1. Ouvrir **Settings → Networking → Generate Domain** sur le service web.
2. Utiliser le domaine Railway pour les premiers tests. Le certificat HTTPS est géré par Railway.
3. Définir `APP_URL` sur cette adresse HTTPS puis redéployer pour actualiser les métadonnées.
4. Pour un domaine personnel, ajouter le domaine dans Railway et recopier exactement les entrées DNS qu'il indique chez votre registrar. Ne pas inventer les valeurs CNAME/TXT.
5. Une fois le domaine personnel actif, mettre `APP_URL` à jour et conserver ce domaine comme adresse définitive : un autre domaine correspond à un autre stockage local.

## 6. Retrouver votre partie et utiliser l'iPhone

1. Ouvrir la nouvelle adresse HTTPS et saisir les identifiants privés.
2. Depuis la page d'accueil, choisir **Explorer librement** pour ouvrir les réglages.
3. Ouvrir **Réglages → Importer**, puis sélectionner votre export JSON.
4. Recharger la page et vérifier les prénoms, l'équipe, le budget et les missions.
5. Sur iPhone, ouvrir le site dans Safari puis **Partager → Sur l'écran d'accueil**. Selon la version d'iOS, le nom exact du menu peut varier.
6. Si le raccourci d'accueil n'utilise pas le même stockage que Safari, y importer aussi la sauvegarde. Ce raccourci n'est pas une application App Store et ne garantit pas un mode hors ligne complet.

Ne pas utiliser la navigation privée pour la partie principale. Faire des exports JSON réguliers : les données locales peuvent disparaître si le stockage du navigateur est effacé ou évincé par le système.

Les mini-sites déjà publiés sur le sandbox et les RSVP reçus dans son PostgreSQL ne sont pas transportés par l'export JSON de la partie. Pour une première installation, republier le mini-site depuis le nouvel hébergement. Pour conserver des réponses existantes, organiser un export/import de la base séparément.

## 7. Vérifications avant usage personnel

- Le service et PostgreSQL sont actifs ; le healthcheck répond positivement.
- Une fenêtre privée sans identifiants reçoit une demande de connexion, y compris sur `/api/share` et `/s/[code]`.
- La partie se recharge correctement sur le domaine choisi.
- Le casting actualise le budget, les missions actualisent la progression et les fenêtres défilent.
- Tester publication et RSVP uniquement avec de fausses données en bêta.
- Activer les sauvegardes de la base/du volume selon les options de l'offre Railway, et tester une restauration.
- Conserver un export JSON de la partie et des sauvegardes PostgreSQL hors de l'environnement principal.
- Surveiller les logs, la consommation et le budget de l'hébergeur. Appli, base et nom de domaine peuvent avoir des coûts distincts ; vérifier les tarifs actuels.

## Avant une ouverture publique à des couples et invités

La préparation d'hébergement n'est pas un audit de sécurité complet. **Ne pas simplement passer `AIME_PRIVATE_ACCESS` à `false` pour lancer un service public.** Les points suivants restent à construire/vérifier :

1. **Droits propriétaire sur les mini-sites.** Actuellement, hors verrou privé, connaître un code de partage suffit à demander sa modification via l'API. Le code public ne doit jamais servir de clé d'édition.
2. **Confidentialité des RSVP.** L'API de lecture du partage expose une liste de réponses hors verrou privé ; séparer la page publique des réponses réservées au couple.
3. **Consultation des RSVP distants.** L'espace des mariés affiche désormais les réponses du serveur, mais par le biais de l'API de partage : prévoir un accès dédié au couple avant une ouverture publique (voir point 2).
4. **Validation serveur et antispam.** Valider complètement les données, plafonner tailles/photos, filtrer les URL autorisées et limiter les soumissions de RSVP.
5. **Stockage durable des photos.** Prévoir un stockage d'objets avec règles d'accès et quotas plutôt que de faire grossir indéfiniment le navigateur et les lignes JSON.
6. **Synchronisation des parties si nécessaire.** Ajouter une sauvegarde serveur et un accès sécurisé pour partager l'organisation entre appareils ou avec un conjoint.
7. **Exploitation et confidentialité.** Tester restauration, suppression effective des données publiées, supervision, politique de conservation, informations RGPD et mises à jour des dépendances.
8. **Contenu métier.** Les personnages et tarifs actuels sont fictifs ; aucune réservation, disponibilité ou transaction réelle n'est connectée.

## Mises à jour futures

Après une modification du schéma, générer une migration sur votre poste :

```sh
npx drizzle-kit generate --config=drizzle.deploy.config.ts --name=description_de_la_modification
```

Relire le SQL, le tester sur une base de test, faire une sauvegarde puis envoyer le code et les migrations dans GitHub. Le pré-déploiement Railway applique uniquement les nouvelles migrations. Ne pas mettre `drizzle-kit push --force` en commande de démarrage de production.

Pour lancer manuellement les migrations dans un environnement de test dont `DATABASE_URL` est configuré :

```sh
npx tsx scripts/migrate.ts
```

## Documentation officielle

- [Railway : déployer Next.js avec PostgreSQL](https://docs.railway.com/guides/nextjs)
- [Railway : configuration versionnée](https://docs.railway.com/reference/config-as-code)
- [Railway : commandes de pré-déploiement](https://docs.railway.com/guides/pre-deploy-command)
- [Railway : domaines et HTTPS](https://docs.railway.com/networking/public-networking)
- [Drizzle : PostgreSQL sur Railway](https://orm.drizzle.team/docs/tutorials/node-railway-pg)
