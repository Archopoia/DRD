# Minigames Immersifs - Action-RPG Gameplay Systems

## Principes Fondamentaux

Chaque **Action** (24 au total, 3 par Aptitude) correspond à un **minigame immersif** intégré dans le jeu action-RPG. Ces minigames doivent être :

1. **Seamless** : Pas de pause, pas de menu, pas d'écran séparé
2. **Temps réel** : Input direct du joueur, réponse immédiate
3. **Première personne** : Perspective FPS pour maintenir l'immersion
4. **Stat-driven** : Les compétences du personnage affectent directement les variables de gameplay (sway, timing, portée, etc.)
5. **Interactifs** : Le joueur contrôle directement l'action, pas juste un jet de dés

Cette approche transforme chaque système de compétence TTRPG en mécanique de gameplay action-RPG directe, similaire aux jeux comme Dark Messiah, Dishonored, Dying Light, ou Kingdom Come: Deliverance.

---

## 1. PUISSANCE → Bataille (Combat Direct)

### 1.1. Frapper → Melee Combat Minigame

**Minigame** : Minijeu de combat au corps à corps - attaquer et se défendre en mêlée

**Mécaniques** :
- **Système unifié** : Minijeu de combat mêlée où le joueur attaque/parade/esquive avec timing
- **Attaques** : Click gauche = Coup horizontal, Click droit = Coup vertical, Combos = Sequences de coups
- **Parade** : Bloquer au bon moment réduit les dégâts, contre-attaque possible (fenêtre temporelle)
- **Esquive** : Direction + Jump = Roulade avec i-frames, stamina nécessaire

**Variantes selon les Compétences** :
- **[Armé]** : Variante "Frappe armée" - Combat avec armes (épées, bâtons, etc.), sway arme réduit par compétence, vitesse attaque, dégâts élevés
- **[Désarmé]** : Variante "Frappe désarmée" - Combat mains nues, portée réduite mais vitesse augmentée, combos plus rapides, dégâts moyens
- **[Improvisé]** : Variante "Frappe improvisée" - Utilisation objets environnementaux comme armes, portée variable selon objet, dégâts variables

**Inspirations** : Dark Messiah of Might and Magic, Dishonored, Mordhau, Chivalry

**Immersion** : Combat fluide, réactif, où la maîtrise du timing et des combos est récompensée. Les animations suivent la caméra pour un feedback immédiat.

---

### 1.2. Neutraliser → Grappling Minigame

**Minigame** : Minijeu de lutte - neutraliser l'ennemi par saisies et techniques rapprochées

**Mécaniques** :
- **Système unifié** : Minijeu de lutte où le joueur saisit/immobilise/projette l'ennemi avec timing
- **Saisie** : Maintenir E près d'un ennemi = Saisie, puis choix rapide de technique (fenêtre temporelle)
- **Projection** : Direction + Click pour projeter l'ennemi après saisie
- **Soumission** : Maintenir pour immobiliser, QTE pour se libérer si c'est l'adversaire

**Variantes selon les Compétences** :
- **[Lutte]** : Variante "Neutralisation par lutte" - Techniques de saisie/projection/soumission, temps saisie réduit, force projection, durée soumission
- **[Bottes]** : Variante "Neutralisation par coups" - Coups de pied rapides et déséquilibre, portée coups, dégâts, capacité déséquilibrer
- **[Ruses]** : Variante "Neutralisation par ruse" - Techniques contre-saisies et ruses, vitesse exécution, efficacité contre-saisies

**Inspirations** : UFC games (système de grappling), Sifu (combat rapproché)

**Immersion** : Caméra légèrement secouée lors des saisies, feedback haptique, animations de corps à corps fluides. Le joueur sent le poids et la résistance de l'adversaire.

---

### 1.3. Tirer → Ranged Combat Minigame

**Minigame** : Minijeu de tir à distance - viser et tirer avec précision

**Mécaniques** :
- **Système unifié** : Minijeu de visée/tir où le joueur vise et tire avec précision et timing
- **Visée** : Click droit = Viseur, Click gauche = Tir, réticule dynamique (s'ouvre mouvement, resserre arrêt)
- **Stabilisation** : Respiration contrôlée (maintenir touche pour réduire sway), barre de stabilité visible
- **Ballistique** : Trajectoire projectiles affectée par distance, vent, gravité selon variante

**Variantes selon les Compétences** :
- **[Bandé]** : Variante "Tir à l'arc" - Arc avec flèches, vitesse flèche, arc trajectoire marqué, temps chargement modéré
- **[Propulsé]** : Variante "Tir propulsé" - Arbalète/catapulte, précision initiale élevée, recharge lente, dégâts élevés
- **[Jeté]** : Variante "Tir lancé" - Lancer objets (pierres, javelots), portée limitée mais rapidité élevée, trajectoire parabolique marquée

**Inspirations** : Kingdom Come: Deliverance (archery), Far Cry (arc), PUBG (ballistique)

**Immersion** : Le sway est visible, le souffle du personnage affecte la stabilité, les projectiles ont une physique réaliste. Feedback audio/visuels lors des impacts.

---

## 2. AISANCE → Infiltration (Stealth & Evasion)

### 2.1. Réagir → Reactive Defense Minigame

**Minigame** : Minijeu de défense réactive - esquiver/parer/contre-attaquer avec timing

**Mécaniques** :
- **Système unifié** : Minijeu de défense réactive où le joueur esquive/parade/contre-attaque avec timing précis
- **Esquive** : Direction + Shift = Esquive rapide direction, i-frames au moment précis
- **Parade réactive** : Bloquer au dernier moment (parry) = Fenêtre contre-attaque dévastatrice
- **Contre-attaque** : Après esquive/parade réussie, fenêtre temporelle pour contre-attaque rapide

**Variantes selon les Compétences** :
- **[Fluidité]** : Variante "Réaction fluide" - Mouvement fluide, durée i-frames Base 0.2s→0.4s, vitesse récupération -50%, fluidité mouvement +60%
- **[Esquive]** : Variante "Réaction par esquive" - Esquives multiples, distance Base 2m→4m, charges Base 1→+2, temps récupération -40%
- **[Évasion]** : Variante "Réaction par évasion" - Évasion rapide et repositionnement, (dés)engagement +100%, faufilage +90%, déliement +80%

**Inspirations** : Dark Souls (i-frames, parry), Sekiro (contre-attaque), Dishonored (fluidité)

**Immersion** : Sons d'esquive distincts, ralenti momentané lors d'une parade réussie, feedback visuel clair des fenêtres d'opportunité. Le joueur doit maîtriser le timing.

---

### 2.2. Dérober → Theft Minigame

**Minigame** : Minijeu de vol - voler à la tire avec timing et précision

**Mécaniques** :
- **Système unifié** : Minijeu de vol où le joueur vole discrètement avec timing et gestion du risque
- **Pickpocket** : Approche discrète, maintien E pour ouvrir inventaire cible, barre progression visible
- **Zone de danger** : Cercle autour cible indiquant champ vision/audition, gestion position/timing
- **Timing critique** : Cliquer au bon moment pour voler sans détection, fenêtre temporelle précise

**Variantes selon les Compétences** :
- **[Escamotage]** : Variante "Vol escamotage" - Vol rapide et discret, vitesse Base 3.0s→1.0s, bruit Base 100%→20%, taille objets Base "small"→"large"
- **[Illusions]** : Variante "Vol par illusion" - Créer leurres visuels pour distraire, illusions trichantes +100%, spectaculaires +90%, diversion/disparition +80%
- **[Dissimulation]** : Variante "Vol par dissimulation" - Se cacher/cacher choses, déplacement silencieux +100%, embuscades/filatures +90%, visibilité -70%

**Inspirations** : Thief series, Dishonored (pickpocket), Skyrim (système amélioré)

**Immersion** : Caméra légèrement inclinée pour montrer la main qui vole, sons de poches et objets, feedback haptique subtil. La tension monte pendant le vol.

---

### 2.3. Coordonner → Coordination Minigame

**Minigame** : Minijeu de coordination - coordonner mouvements et gestes avec précision

**Mécaniques** :
- **Système unifié** : Minijeu de coordination où le joueur coordonne mouvements/gestes avec timing et précision
- **Gestion posture** : Contrôle posture/gestuelle en temps réel, barre de stabilité/fluidité visible
- **Coordination fine** : Actions délicates nécessitant coordination gestes/équilibre, timing critique
- **Feedback coordination** : Indicateurs visuels de qualité coordination, fluidité animations selon compétence

**Variantes selon les Compétences** :
- **[Gestuelle]** : Variante "Coordination gestuelle" - Danse/posture/gestes coordonnés, fluidité gestuelle +100%, posture combat +90%, pantomime/rituelle +80%
- **[Minutie]** : Variante "Coordination minutieuse" - Précision délicatesse/doigté, impact/impulsion +100%, précision manipulation +90%, timing optimal +80%
- **[Équilibre]** : Variante "Coordination équilibre" - Équilibre surfaces difficiles, stabilisant +100%, funambule/jonglage +90%, surchargé +80%, réduction chute -90%

**Inspirations** : Thief series, Splinter Cell, Dishonored (stealth movement)

**Immersion** : Indicateur de visibilité intégré à l'UI (peut-être une bordure d'écran qui change de couleur), sons de pas réalistes, feedback visuel des zones d'ombre. Le joueur doit gérer son bruit et sa visibilité en temps réel.

---

## 3. PRÉCISION → Artisanat (Crafting & Subterfuge)

### 3.1. Manier → Precision Manipulation Minigame

**Minigame** : Minijeu de manipulation précise - contrôler finement un outil/système avec précision

**Mécaniques** :
- **Système unifié** : Minijeu de précision où le joueur manipule finement un outil/système avec viseur/réticule et contrôle stable
- **Respiration contrôlée** : Maintenir touche pour stabiliser (réduire sway), gestion de la respiration en temps réel
- **Zone de précision** : Réticule/zone cible visible, succès dépend de la précision du placement/alignement
- **Timing et stabilité** : Actions délicates nécessitant maintien de la stabilité, erreurs ont conséquences immédiates

**Variantes selon les Compétences** :
- **[Visée]** : Variante "Manipulation par visée" - Viseur réticule pour actions précises (serrures, mécanismes, réparation), réduction sway -80%, précision zone +100%, temps stabilisation -60%
- **[Conduite]** : Variante "Manipulation par conduite" - Système conduite véhicules avec précision directionnelle, stabilité -70% dérive, vitesse max +50%, capacité manœuvre +100%
- **[Habileté]** : Variante "Manipulation manuelle" - Actions délicates précision manuelle (picklocking, assemblage fin), vitesse -50%, précision -75% erreur, réduction erreurs -80%

**Inspirations** : Kingdom Come: Deliverance (lockpicking), Payday 2 (minigames), Euro Truck Simulator (conduite réaliste)

**Immersion** : Vue rapprochée des mains selon variante (outils visibles, volant/commandes, outils manuels), sons mécanismes, feedback tactile. Structure unifiée : précision et stabilité.

---

### 3.2. Façonner → Shaping Minigame

**Minigame** : Minijeu de façonnage - assembler/créer/modifier des objets dans le monde

**Mécaniques** :
- **Système unifié** : Minijeu d'assemblage physique où le joueur façonne des objets par placement/précision
- **Crafting contextuel** : Pointer objet/environnement, menu radial rapide (pas de pause), sélection directe dans le monde
- **Placement précis** : Placer composants dans zones cibles avec timing et orientation, séquence d'actions (fixer clics, ajuster molette)
- **Feedback immédiat** : Essai/erreur avec feedback visuel instantané, qualité visible selon précision

**Variantes selon les Compétences** :
- **[Débrouillardise]** : Variante "Façonnage improvisé" - Utilisation objets trouvés, combinaisons improvisées, qualité improvisés +90%, vitesse -50%, efficacité matériaux non-optimaux +80%
- **[Bricolage]** : Variante "Façonnage réparation" - Réparation objets (aligner pièces, appliquer correctifs), efficacité +100%, qualité +90%, durée vie +150%
- **[Savoir-Faire]** : Variante "Façonnage expert" - Création objets complexes, complexité Niv 1→5, qualité max +100%, temps -60%

**Inspirations** : The Forest (crafting immersif), Subnautica (construction), No Man's Sky (crafting contextuel)

**Immersion** : Pas de menu séparé, animations première personne, objets visibles dans les mains. Structure unifiée : assemblage/façonnage selon variante (improvisé, réparation, expert).

---

### 3.3. Fignoler → Refinement Minigame

**Minigame** : Minijeu de fignolage - installer/désarmer/résoudre des systèmes complexes avec précision

**Mécaniques** :
- **Système unifié** : Minijeu de manipulation fine de systèmes complexes (pièges, sécurité, puzzles) avec timing et précision
- **Placement/Manipulation précise** : Pointer surface/système, placer composants ou manipuler mécanismes avec précision
- **Timing critique** : Minijeu de timing pour armer/désarmer/résoudre en sécurité, fenêtres temporelles critiques
- **Identification systèmes** : Reconnaissance visuelle de systèmes/composants, indices visuels selon compétence

**Variantes selon les Compétences** :
- **[Artifices]** : Variante "Fignolage pièges" - Installation/armement pièges complexes, complexité Niv 1→5, dégâts/durée +100%, efficacité détection -70%
- **[Sécurité]** : Variante "Fignolage sécurité" - Désarmement/contournement systèmes sécurité (lasers, alarmes), vitesse -60%, identification +100%, réduction risques -80%
- **[Casse-Têtes]** : Variante "Fignolage puzzles" - Résolution puzzles mécaniques complexes (serrures avancées, mécanismes), temps -70%, complexité max +150%, indices +120%

**Inspirations** : Thief series (traps), Hitman (security systems), The Witness (puzzle mechanics)

**Immersion** : Vue rapprochée selon variante (pièges, systèmes, puzzles), sons mécanismes, tension timing. Structure unifiée : manipulation fine avec timing critique.

---

## 4. ATHLÉTISME → Prouesse (Physical Feats)

### 4.1. Traverser → Traversal Minigame

**Minigame** : Minijeu de traversée - déplacement acrobatique et navigation d'environnement

**Mécaniques** :
- **Système unifié** : Minijeu de mouvement acrobatique où le joueur traverse des obstacles/environnements
- **Parkour automatique** : Sprint + Jump = Saut automatique sur obstacles, grimpe surfaces, détection automatique des possibilités
- **Gestion endurance** : Barre de stamina visible, épuisement progressif, récupération nécessaire
- **Physique contextuelle** : Mouvement adapté selon contexte (terre, eau, air) avec physique appropriée

**Variantes selon les Compétences** :
- **[Pas]** : Variante "Traversée terrestre" - Marche/course/charge sur terrain, vitesse max +100%, efficacité endurance +80%, capacité charge +150%
- **[Saut]** : Variante "Traversée acrobatique" - Sauts/vaulting/grimpe obstacles, hauteur +100%, distance +120%, atterrissage sans dégâts +200%
- **[Natation]** : Variante "Traversée aquatique" - Nage sous l'eau avec barre oxygène, vitesse +90%, consommation oxygène -60%, capacité équipement +100%

**Inspirations** : Mirror's Edge (parkour), Dying Light (parkour + combat), Tomb Raider (climbing)

**Immersion** : Mouvement fluide réactif selon variante (terrain, obstacles, eau), caméra suit mouvements, sons contextuels. Structure unifiée : traversée avec gestion endurance.

---

### 4.2. Efforcer → Exertion Minigame

**Minigame** : Minijeu d'effort - exploits de force avec gestion active de l'endurance

**Mécaniques** :
- **Système unifié** : Minijeu d'effort physique où le joueur effectue des actions de force avec gestion endurance active
- **Effort soutenu** : Maintenir action (soulever, grimper, pousser) avec barre d'endurance qui se vide, relâcher pour récupérer
- **Progression par effort** : Actions progressives nécessitant maintien de l'effort (grimpe barre qui se vide, port ralentissement progressif)
- **Feedback physique** : Ralentissement visible, fatigue animations, capacité réduite selon niveau d'épuisement

**Variantes selon les Compétences** :
- **[Port]** : Variante "Effort portage" - Soulever/porter objets lourds, poids max 50kg→150kg, vitesse charges +80%, durée épuisement +150%
- **[Grimpe]** : Variante "Effort escalade" - Escalade surfaces verticales avec endurance active, vitesse +100%, pentes 70°→100°, récupération +90%
- **[Acrobatie]** : Variante "Effort acrobatique" - Mouvements complexes force/agilité (roulade, saut périlleux), complexité Niv 1→5, réduction dégâts -90%, fluidité +100%

**Inspirations** : Breath of the Wild (climbing stamina), Uncharted (climbing), Dark Souls (carry weight)

**Immersion** : Animations visibles selon variante (portage objets, escalade, acrobatie), barre endurance visible, feedback physique (ralentissement, fatigue). Structure unifiée : effort soutenu avec gestion endurance.

---

### 4.3. Manœuvrer → Specialized Movement

**Minigame** : Mouvements spécialisés avec contrôles physiques immersifs

**Mécaniques** :
- **Vol** : Système de vol/planage avec contrôles physiques (gestion altitude avec espace/ctrl, vitesse avec inclinaison, consommation énergie en temps réel)
- **Fouissage** : Creuser avec mouvement physique (creuser avec clics, gestion oxygène barre visible, orientation avec boussole/indicateurs)
- **Chevauchement** : Contrôle monture avec direction et vitesse, système de lien (barre de confiance), combats à cheval avec physique réaliste

**Variables affectées par les Stats** :
- **[Vol]** : Durée vol (+200% à Niv 5), manœuvrabilité (+100% à Niv 5), consommation énergie (-60% à Niv 5), vitesse maximale (+80% à Niv 5)
- **[Fouissage]** : Vitesse creusement (+100% à Niv 5), profondeur accessible (+150% à Niv 5), capacité respirer (+120% oxygène à Niv 5), orientation (indicateurs +100% à Niv 5)
- **[Chevauchement]** : Contrôle monture (+100% précision à Niv 5), vitesse (+80% à Niv 5), endurance monture (+150% à Niv 5), capacité combattre cheval (+90% efficacité à Niv 5)

**Inspirations** : Anthem (flight), Minecraft (digging), Red Dead Redemption (horse riding)

**Immersion** : Physique réaliste du vol, sensation de vitesse et de mouvement, feedback visuel et audio des mouvements spécialisés.

---

## 5. CHARISME → Corrompre (Social Manipulation)

### 5.1. Captiver → Social Interaction / Charisma

**Minigame** : Interaction sociale immersive avec timing et choix

**Mécaniques** :
- **Dialogue en temps réel** : Pas de pause, conversations fluides, choix avec fenêtres temporelles
- **Séduction** : Actions contextuelles (rapprochement, contact visuel, gestes), minijeu de timing
- **Tromperie** : Indicateur de crédibilité, maintien de la cohérence des mensonges
- **Présentation** : Posture et gestes du personnage affectent la réception sociale

**Variables affectées par les Stats** :
- **[Séduction]** : Fenêtre succès élargie (+150% à Niv 5), impact gestes (+100% à Niv 5), réduction difficulté (-60% à Niv 5)
- **[Tromperie]** : Crédibilité base (+100% à Niv 5), capacité maintenir mensonges complexes (+120% durée à Niv 5), détection incohérences (-70% risque à Niv 5)
- **[Présentation]** : Impact première impression (+100% à Niv 5), capacité maintenir attention (+90% durée à Niv 5), charisme général (+80% à Niv 5)

**Inspirations** : Mass Effect (dialogue wheel sans pause), LA Noire (detection), Red Dead Redemption 2 (social interaction)

**Immersion** : Caméra proche lors des dialogues, animations faciales, sons de voix. Les choix doivent être faits rapidement pour maintenir le flux.

---

### 5.2. Convaincre → Negotiation / Persuasion

**Minigame** : Négociation active et performance avec minijeux intégrés

**Mécaniques** :
- **Négociation** : Système de marchandage actif (offres/contre-offres avec timing, barre satisfaction visible, choix de pression/conciliation), pas de menu mais interface dans le monde
- **Chant** : Minijeu de rythme (appuyer sur touches au bon timing, barre de précision, effet sur ambiance visible dans l'environnement)
- **Inspiration** : Actions de motivation (choix de gestes/paroles avec timing, barre d'inspiration visible, effets visibles sur alliés/neutres)

**Variables affectées par les Stats** :
- **[Négociation]** : Qualité offres initiales (+80% à Niv 5), capacité négocier prix (+100% marge à Niv 5), fenêtre succès (+120% à Niv 5)
- **[Chant]** : Impact émotionnel (+150% à Niv 5), durée effets (+100% à Niv 5), capacité maintenir rythme (fenêtre timing +100% à Niv 5)
- **[Inspiration]** : Portée influence (+100% à Niv 5), durée effets (+120% à Niv 5), capacité inspirer actions (+90% à Niv 5)

**Inspirations** : Pathologic 2 (trading), The Elder Scrolls (persuasion), Assassin's Creed (social stealth)

**Immersion** : Pas de menu de trading séparé, négociation dans le monde, feedback visuel des réactions (expressions faciales, gestes).

---

### 5.3. Interpréter → Interpretation Minigame

**Minigame** : Minijeu d'interprétation - transmettre un message par la performance

**Mécaniques** :
- **Système unifié** : Minijeu de timing/rythme où le joueur interprète pour influencer une audience
- **Barre de précision/interprétation** : Indicateur visible montrant la qualité de l'interprétation en temps réel
- **Feedback audience** : Réactions visibles de l'audience (expressions, gestes) qui changent selon la performance
- **Fenêtres temporelles** : Appuyer/choisir au bon moment pour maintenir l'attention et maximiser l'impact

**Variantes selon les Compétences** :
- **[Instrumental]** : Variante "Interprétation musicale" - Système jeu d'instrument (appuyer touches au bon rythme), complexité Niv 1→5, qualité sonore +100%, effet émotionnel +150%
- **[Mimétisme]** : Variante "Interprétation par imitation" - Reproduire séquences gestes/intonations avec timing, précision +100%, capacité tromper +90%, durée +120%
- **[Narration]** : Variante "Interprétation narrative" - Raconter histoires avec choix narratifs en temps réel, impact émotionnel +100%, capacité maintenir attention +90%, effets narratifs +120%

**Inspirations** : Ocarina of Time (instrument playing), Assassin's Creed (blending), The Witcher 3 (gwent storytelling)

**Immersion** : Le minijeu change d'interface selon la variante (instrument visible dans les mains, gestes visibles, narration sans instrument), mais la structure reste la même : timing/rythme pour influencer l'audience avec feedback visuel immédiat.

---

## 6. DÉTECTION → Enquête (Investigation)

### 6.1. Discerner → Perception Minigame

**Minigame** : Minijeu de perception - observer et analyser l'environnement avec les sens

**Mécaniques** :
- **Système unifié** : Minijeu de perception où le joueur analyse l'environnement avec un sens spécialisé
- **Mode analyse** : Maintenir touche pour zoomer/analyser, highlight objets importants selon sens
- **Feedback sensoriel** : Indicateurs visuels/audio selon sens actif (vision, odorat, estimation)
- **Information révélée** : Plus la perception est bonne, plus d'informations sont révélées en temps réel

**Variantes selon les Compétences** :
- **[Vision]** : Variante "Perception visuelle" - Zoom/analyse visuelle, portée +100%, détection cachés +120%, qualité analyse +90%
- **[Odorat]** : Variante "Perception olfactive" - Pistes olfactives visibles (particules, chemins), portée +150%, clarté pistes +100%, identification odeurs +120%
- **[Estimation]** : Variante "Perception par estimation" - Calcul distances/tailles/quantités, précision +90%, vitesse analyse -60%, quantité infos +150%

**Inspirations** : Batman: Arkham (detective mode), The Witcher 3 (witcher senses), Sherlock Holmes games

**Immersion** : Pas de "mode détective" séparé, highlights subtils intégrés naturellement selon variante. Structure unifiée : perception active avec feedback sensoriel.

---

### 6.2. Découvrir → Discovery Minigame

**Minigame** : Minijeu de découverte - examiner et connecter des indices pour découvrir des secrets

**Mécaniques** :
- **Système unifié** : Minijeu de découverte où le joueur examine et connecte des indices pour reconstruire des événements
- **Examen actif** : Manipulation directe objets (tourner souris, zoom, inspecter détails), minijeu découverte (chercher zones interactives, timing)
- **Connection d'indices** : Système visuel connexion (glisser indices, reconstruction événements, validation séquences logiques)
- **Feedback découverte** : Plus la découverte est bonne, plus d'informations/événements sont révélés

**Variantes selon les Compétences** :
- **[Investigation]** : Variante "Découverte par investigation" - Fouille/examen actif, connecter indices, nombre indices +100%, qualité reconstitutions +120%, vitesse -50%
- **[Audition]** : Variante "Découverte par audition" - Écoute active son spatialisé 3D, localisation sources, portée +150%, identification sons +100%, précision +120%
- **[Goût]** : Variante "Découverte par goût" - Analyser substances (dégustation timing), identification +100%, détection poisons/ingrédients +150%, portée +120%

**Inspirations** : Return of the Obra Dinn (investigation), LA Noire (crime scene), The Vanishing of Ethan Carter

**Immersion** : Interaction directe avec objets du monde, pas de menu inventaire. Structure unifiée : examen/analyse/connection selon variante sensorielle.

---

### 6.3. Dépister → Tracking Minigame

**Minigame** : Minijeu de pistage - suivre des traces et détecter des présences avec perception sensorielle

**Mécaniques** :
- **Système unifié** : Minijeu de pistage où le joueur suit des traces/détecte présences avec perception spécialisée
- **Mode focus** : Zoom + highlight pour rendre traces plus visibles, minijeu suivi (maintenir trace visible, choix direction intersections)
- **Perception active** : Minijeu concentration pour amplifier perception selon variante, alerte dangers/présences
- **Feedback sensoriel** : Indicateurs visuels subtils selon sens (visuel, tactile, ressenti), pas d'indicateur magique

**Variantes selon les Compétences** :
- **[Toucher]** : Variante "Pistage tactile" - Analyser textures/températures (caresser surfaces souris, feedback haptique), précision +100%, détails subtils +120%, vitesse -60%
- **[Ressenti]** : Variante "Pistage par ressenti" - Détecter vibrations/présences (indicateurs subtils, concentration), portée +150%, précision localisation +100%, identifier menaces +120%
- **[Intéroception]** : Variante "Pistage intéroceptif" - Perception interne active (barres faim/fatigue/blessures, gestion ressources), précision interne +100%, gestion ressources +90%

**Inspirations** : The Hunter: Call of the Wild (tracking), Red Dead Redemption 2 (hunting/tracking)

**Immersion** : Traces visibles monde mais subtiles, nécessite attention observation active. Structure unifiée : pistage/perception selon variante sensorielle.

---

## 7. RÉFLEXION → Énigme (Puzzle-Solving)

### 7.1. Concevoir → Puzzle Creation / Assembly

**Minigame** : Création et assemblage de solutions physiques pour résoudre des énigmes

**Mécaniques** :
- **Assemblage physique** : Manipulation directe de pièces/objets dans l'environnement pour créer une solution (comme assembler un mécanisme, combiner des éléments naturels)
- **Prévisualisation** : Visualisation mentale (overlay subtil) de la solution possible avant assemblage
- **Placement précis** : Positionnement précis des pièces nécessitant dextérité et timing
- **Test de la solution** : Activation et test immédiat, avec feedback visuel de succès/échec

**Variables affectées par les Stats** :
- **[Artisanat]** : Précision du placement (-50% erreur à Niv 5), vitesse d'assemblage (-40% temps), qualité finale (durabilité +100% à Niv 5)
- **[Nature]** : Reconnaissance des matériaux naturels (indices visuels +80%), efficacité des combinaisons naturelles (+60%), portée des solutions naturelles
- **[Société]** : Compréhension des systèmes sociaux (indices contextuels +70%), capacité à exploiter les relations (solutions alternatives +50%), timing social optimal

**Inspirations** : The Witness (puzzle assembly), Portal (environmental puzzle creation), Breath of the Wild (crafting solutions)

**Immersion** : Vue rapprochée des mains lors de l'assemblage, sons de pièces qui s'emboîtent, feedback visuel immédiat. Les puzzles sont physiques, pas abstraits.

---

### 7.2. Acculturer → Cultural Integration Minigame

**Minigame** : Minijeu d'acculturation - intégrer et appliquer des connaissances dans un contexte culturel

**Mécaniques** :
- **Système unifié** : Minijeu de timing et choix contextuel où le joueur applique des connaissances spécialisées dans le monde (pas de menu)
- **Barre de progression contextuelle** : Barre visible montrant le progrès de l'acculturation/intégration
- **Actions contextuelles** : Manipulation directe d'objets/concepts selon le contexte (cartes, instruments médicaux, outils agricoles)
- **Timing et précision** : Fenêtres temporelles pour choisir/appliquer les bonnes actions au bon moment

**Variantes selon les Compétences** :
- **[Jeux]** : Variante "Acculturation ludique" - Minijeu de stratégie/chance intégré dans le monde (cartes, dés, jeux de société), fenêtre succès +200% à Niv 5, capacité bluffer +60%, indices +80%
- **[Médecine]** : Variante "Acculturation médicale" - Minijeu diagnostic/traitement (examiner symptômes, appliquer remèdes), précision diagnostic +100%, vitesse +50%, fenêtre guérison +150%
- **[Pastoralisme]** : Variante "Acculturation agricole" - Minijeu soins/gestion (identifier besoins, appliquer traitements), identification besoins +90%, efficacité traitements +70%, timing optimal +120%

**Inspirations** : Gwent dans The Witcher 3, Kingdom Come: Deliverance (alchemy/medicine), Stardew Valley (farming mechanics)

**Immersion** : Le minijeu se déroule dans le monde selon le contexte (table de jeu, lit de malade, champ), pas dans un menu séparé. Le joueur manipule directement les éléments avec les mains visibles selon la variante choisie.

---

### 7.3. Acclimater → Adaptation Minigame

**Minigame** : Minijeu d'acclimatation - s'adapter et optimiser pour un environnement spécifique

**Mécaniques** :
- **Système unifié** : Minijeu de configuration/optimisation où le joueur adapte des systèmes à un environnement
- **Manipulation environnementale** : Modifier/optimiser directement dans le monde (pas de menu abstrait)
- **Barre d'efficacité** : Indicateur visible montrant le niveau d'acclimatation/optimisation
- **Timing et séquence** : Actions à effectuer dans un ordre précis avec timing optimal pour maximiser l'efficacité

**Variantes selon les Compétences** :
- **[Ingénierie]** : Variante "Acclimatation mécanique" - Manipulation mécanismes complexes (engrenages, leviers, systèmes hydrauliques), complexité Niv 1→5, vitesse -50%, timing +100%
- **[Géographie]** : Variante "Acclimatation géographique" - Navigation et optimisation du terrain (trouver chemins, optimiser routes), mémorisation +80%, vitesse navigation +60%, chemins alternatifs +100%
- **[Agronomie]** : Variante "Acclimatation agricole" - Configuration optimale terrains/cultures (placement, timing, ressources), précision placement +70%, vitesse configuration -40%, efficacité +90%

**Inspirations** : The Witness (mechanical puzzles), Portal 2 (complex mechanisms), Breath of the Wild (environmental navigation)

**Immersion** : Manipulation directe selon la variante (engrenages zoomés, navigation terrain 3D, placement cultures), sons réalistes, feedback visuel immédiat. Toutes les variantes partagent la même structure de minijeu d'adaptation.

---

## 8. DOMINATION → Débat (Persuasion & Will)

### 8.1. Discipliner → Argumentation / Verbal Combat

**Minigame** : Système de débat et argumentation en temps réel

**Mécaniques** :
- **Argumentation active** : Choisir et énoncer des arguments avec timing (fenêtres temporelles, pas de pause du dialogue)
- **Contre-arguments** : Répondre aux objections en temps réel avec réponses appropriées (système de matching argument→objection)
- **Intimidation par voix** : Ton et posture affectent l'impact (tension/relâchement contrôlés par le joueur)
- **Résistance obstinée** : Maintenir sa position contre les attaques verbales (minijeu de résistance, barre de conviction)

**Variables affectées par les Stats** :
- **[Commandement]** : Clarté des arguments (fenêtre de timing +120% à Niv 5), portée d'influence (+80%), impact sur auditoire (+100%)
- **[Intimidation]** : Force des arguments intimidants (+90%), réduction de la résistance adverse (-60% à Niv 5), capacité à faire reculer (+70%)
- **[Obstinance]** : Barre de résistance maximale (+150% à Niv 5), vitesse de récupération (+80%), maintien de position (fenêtre +100%)

**Inspirations** : Papers Please (argumentation), Disco Elysium (verbal combat), LA Noire (interrogation timing)

**Immersion** : Dialogue en temps réel sans pause, choix rapides avec fenêtres temporelles, animations faciales réactives. Le joueur doit réagir rapidement aux arguments adverses.

---

### 8.2. Endurer → Resistance Challenge / Willpower Test

**Minigame** : Système actif de résistance et de test de volonté

**Mécaniques** :
- **Test de volonté actif** : Maintenir une action/pression face à la résistance (barre de volonté qui se vide, cliquer/maintenir pour résister)
- **Résistance aux influences** : Contrer les tentatives d'influence sociale/magique avec timing (fenêtres de contre-pression)
- **Endurance de consommation** : Gérer consommation rapide (gloutonnerie/beuverie) avec timing pour éviter effets négatifs
- **Récupération active** : Régénérer volonté/endurance par concentration (minijeu de respiration/stabilisation)

**Variables affectées par les Stats** :
- **[Gloutonnerie]** : Vitesse de consommation (+100% à Niv 5), fenêtre de timing pour éviter effets négatifs (+150%), capacité digestive (+80%)
- **[Beuverie]** : Barre de résistance aux toxines (+120% à Niv 5), vitesse de récupération (+90%), capacité fonctionnelle sous influence (+70%)
- **[Entrailles]** : Barre de résistance aux maladies/poisons (+200% à Niv 5), vitesse de régénération (+100%), durée de survie sans ressources (+150%)

**Inspirations** : Dark Souls (estus drinking timing), Kingdom Come: Deliverance (realistic consumption), Sekiro (posture/deflection)

**Immersion** : Barres de volonté/résistance visibles mais intégrées, actions de consommation animées (mains visibles), effets visuels des conditions (tremblements, vision floue). La résistance est active, pas passive.

---

### 8.3. Dompter → Persuasion Through Action / Demonstration

**Minigame** : Convaincre par la démonstration et l'exemple plutôt que par les mots

**Mécaniques** :
- **Démonstration active** : Montrer par l'action (exécuter une tâche, résoudre un problème) pour convaincre
- **Approche progressive** : Système de confiance construit par actions répétées (barre de progression visible, actions réussies l'augmentent)
- **Commandes par gestes** : Communiquer par gestes/posture (contrôlés par le joueur) plutôt que par dialogue
- **Renforcement par timing** : Récompenser/renforcer au bon moment avec actions contextuelles (distribution de nourriture, caresses, corrections)

**Variables affectées par les Stats** :
- **[Apprivoisement]** : Vitesse de gain de confiance (+120% à Niv 5), portée des actions convaincantes (+80%), stabilité de la relation (+90%)
- **[Obéissance]** : Clarté des commandes gestuelles (+100%), vitesse d'exécution des ordres (+70%), complexité des commandes possibles (+150% à Niv 5)
- **[Dressage]** : Précision du timing de renforcement (+90%), vitesse d'apprentissage (+80%), complexité des techniques enseignables (+100% à Niv 5)

**Inspirations** : Shadow of the Colossus (bonding through action), Red Dead Redemption 2 (horse bonding through care), Brothers: A Tale of Two Sons (non-verbal communication)

**Immersion** : Actions visuelles directes (caresses, nourriture, gestes), barre de confiance visible mais subtile, feedback visuel des réactions. Le processus est progressif et interactif, pas un menu.

---

## Principes de Design Globaux

### Intégration Seamless

- **Pas de pause** : Tous les minigames s'exécutent dans le monde, sans pause ni menu séparé
- **Transitions fluides** : Passage naturel entre les différents modes de gameplay
- **UI minimale** : Les indicateurs sont intégrés naturellement (barres d'endurance, indicateurs visuels subtils)

### Stat-to-Gameplay Translation

- **Variables ajustables** : Chaque compétence affecte directement des variables de gameplay mesurables
- **Feedback visible** : Les améliorations de compétence sont perceptibles immédiatement (moins de sway, plus de vitesse, etc.)
- **Progression naturelle** : L'amélioration des compétences se ressent dans le gameplay, pas seulement dans les chiffres

### Immersion Maximale

- **Première personne** : Toutes les actions sont vues de la perspective du personnage
- **Animations réalistes** : Les mains et le corps du personnage sont visibles lors des actions
- **Feedback multisensoriel** : Son, visuel, et haptique pour un feedback complet
- **Conséquences** : Les erreurs ont des conséquences visibles et mécaniques

### Accessibilité

- **Courbe d'apprentissage** : Les minigames commencent simples et se complexifient avec la maîtrise
- **Options de difficulté** : Variables ajustables pour différents niveaux de compétence
- **Indicateurs optionnels** : Aides visuelles qui peuvent être désactivées pour plus de challenge

---

## Exemples de Variables de Gameplay par Compétence

### Exemple 1 : [Armé] (Puissance → Frapper)

- **Weapon Sway** : Base 100%, réduit par compétence (max -80% à Niv 5)
- **Attack Speed** : Base 1.0s, réduit par compétence (max 0.5s à Niv 5)
- **Damage Multiplier** : Base 1.0x, augmenté par compétence (max 2.0x à Niv 5)
- **Parry Window** : Base 0.2s, augmenté par compétence (max 0.5s à Niv 5)
- **Stamina Cost** : Base 20, réduit par compétence (max 10 à Niv 5)

### Exemple 2 : [Escamotage] (Aisance → Dérober)

- **Pickpocket Speed** : Base 3.0s, réduit par compétence (max 1.0s à Niv 5)
- **Noise Generation** : Base 100%, réduit par compétence (max 20% à Niv 5)
- **Success Window** : Base 0.5s, augmenté par compétence (max 2.0s à Niv 5)
- **Detection Risk** : Base 100%, réduit par compétence (max 10% à Niv 5)
- **Item Size Limit** : Base "small", augmenté par compétence (max "large" à Niv 5)

### Exemple 3 : [Ingénierie] (Réflexion → Acclimater)

- **Mechanism Complexity** : Base Niv 1, augmenté par compétence (max Niv 5 à Niv 5)
- **Repair Speed** : Base 5.0s, réduit par compétence (max 1.5s à Niv 5)
- **Construction Quality** : Base 75%, augmenté par compétence (max 100% à Niv 5)
- **Puzzle Clue Visibility** : Base 50%, augmenté par compétence (max 100% à Niv 5)
- **Material Efficiency** : Base 100%, amélioré par compétence (max 150% à Niv 5)

---

## Conclusion

Chacun des 24 Actions (3 par Aptitude) devient un système de gameplay immersif et action-based. Les compétences TTRPG se transforment en variables de gameplay directes, permettant une progression ressentie et significative.

L'objectif est de créer un jeu où chaque type d'interaction est engageant et gratifiant, où la maîtrise des compétences se reflète immédiatement dans le gameplay, et où l'immersion est maintenue à tout moment.
