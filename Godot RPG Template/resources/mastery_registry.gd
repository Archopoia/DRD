extends Resource
class_name MasteryRegistry

## Registry mapping each Competence to its array of Mastery names
## All masteries extracted from page 18 of the book

const MASTERY_REGISTRY: Dictionary = {
	# Puissance - Frapper
	CompetenceData.Competence.ARME: [
		"Arme de Poigne",
		"d'Antipôle",
		"de Parade",
		"de Garde",
		"Équilibrées",
		"Flexibles"
	],
	CompetenceData.Competence.DESARME: [
		"Coup sans espace",
		"Poings",
		"Pieds",
		"Coude",
		"Genou",
		"Corps"
	],
	CompetenceData.Competence.IMPROVISE: [
		"Arme à coupures",
		"à pieds",
		"rondes",
		"de mains",
		"de paume",
		"de lien",
		"Jet d'arme improvisée"
	],
	
	# Puissance - Neutraliser
	CompetenceData.Competence.LUTTE: [
		"Saisie",
		"Bousculade",
		"Mise à Terre",
		"Projection",
		"Soumission"
	],
	CompetenceData.Competence.BOTTES: [
		"Bloquer",
		"Agrippement",
		"Entravement",
		"Désarmement",
		"Prise d'arme",
		"Retournement d'arme"
	],
	CompetenceData.Competence.RUSES: [
		"Enchaînement",
		"Feinter",
		"Contre",
		"Hébétement",
		"Essouffler",
		"Battement",
		"Destruction",
		"Postures",
		"Prises d'arme"
	],
	
	# Puissance - Tirer
	CompetenceData.Competence.BANDE: [
		"Encordage (mettre la corde)",
		"Surbandé",
		"en Tirs Courbés",
		"Tirs multiples"
	],
	CompetenceData.Competence.PROPULSE: [
		"Tirs Rapprochés",
		"Tirs Longue Distance",
		"Tirs Imprévisibles",
		"Tirs sur 360"
	],
	CompetenceData.Competence.JETE: [
		"de Paume",
		"à Manche",
		"Rattrapage de jet",
		"Jets multiples"
	],
	
	# Aisance - Réagir
	CompetenceData.Competence.FLUIDITE: [
		"Réactivité",
		"Spontanéité",
		"Rythmique",
		"Feinter",
		"Contrer"
	],
	CompetenceData.Competence.ESQUIVE: [
		"Repositionnante",
		"en Roulade",
		"Préparée",
		"Instinctive"
	],
	CompetenceData.Competence.MINUTIE: [
		"Délicatesse",
		"Doigté",
		"Impact",
		"Impulsion"
	],
	
	# Aisance - Dérober
	CompetenceData.Competence.ESCAMOTAGE: [
		"Espionnant",
		"d'Objets portés",
		"de Véhicules",
		"de Créatures"
	],
	CompetenceData.Competence.ILLUSIONS: [
		"Trichantes",
		"Spectaculaires",
		"de Diversion",
		"de Disparition"
	],
	CompetenceData.Competence.DISSIMULATION: [
		"Se cacher",
		"Cacher des Choses",
		"Déplacement silencieux",
		"Embuscades/Filatures"
	],
	
	# Aisance - Coordonner
	CompetenceData.Competence.GESTUELLE: [
		"Danse",
		"Posture (au combat)",
		"Pantomime",
		"Rituelle",
		"Athlétique",
		"Improvisée"
	],
	CompetenceData.Competence.EVASION: [
		"(Dés)Engagement",
		"Faufilage",
		"Déliement",
		"Délivrement"
	],
	CompetenceData.Competence.EQUILIBRE: [
		"Stabilisant",
		"en Sols difficiles",
		"Funambule",
		"Jonglage",
		"Surchargé"
	],
	
	# Précision - Manier
	CompetenceData.Competence.VISEE: [
		"Mécanismes d'armement",
		"Tir à longue distance",
		"Tir de soutien",
		"en Position difficile",
		"Visée multiple"
	],
	CompetenceData.Competence.CONDUITE: [
		"Propulsion personnelle",
		"Tirée par créatures",
		"dans le Risque",
		"la Terre",
		"les Liquides",
		"les Airs",
		"le Vide",
		"sur Terrain difficile",
		"sur Pistes/Rails",
		"sur Liquides (glisse)"
	],
	CompetenceData.Competence.HABILETE: [
		"Une main",
		"Deux mains",
		"Ambidextrie",
		"Recharge/Réarmement",
		"Munition en Main",
		"Parade"
	],
	
	# Précision - Façonner
	CompetenceData.Competence.DEBROUILLARDISE: [
		"Monte de camp",
		"Orientation",
		"Allumage/Extinction",
		"Camouflage"
	],
	CompetenceData.Competence.BRICOLAGE: [
		"Contrefaçon",
		"Raccommodage",
		"Amélioration",
		"Improvisation"
	],
	CompetenceData.Competence.SAVOIR_FAIRE: [
		"Alimentaire",
		"des Graisses",
		"du Papier",
		"des Plantes",
		"du Textile",
		"du Cuir",
		"du Verre",
		"de la Construction",
		"des Métaux",
		"des Richesses",
		"du Bois",
		"de la Lutherie",
		"des Arts plastiques",
		"des Arts de dessein",
		"de la Récolte"
	],
	
	# Précision - Fignoler
	CompetenceData.Competence.ARTIFICES: [
		"Amorçage",
		"Désamorçage",
		"Enfumants",
		"Explosifs"
	],
	CompetenceData.Competence.SECURITE: [
		"Dévérouillage",
		"Verrouillage",
		"Copie de serrure",
		"Copie de Clef"
	],
	CompetenceData.Competence.CASSE_TETES: [
		"Nœuds d'Attelage",
		"de Saisine",
		"de Coude",
		"de Boucle",
		"Épissure de corde",
		"Casse-têtes",
		"Craque-coffre",
		"Puzzles"
	],
	
	# Athlétisme - Traverser
	CompetenceData.Competence.PAS: [
		"Ramper",
		"Marcher",
		"Courir",
		"Charger",
		"Pédaler"
	],
	CompetenceData.Competence.GRIMPE: [
		"Montagnard",
		"Glaciaire",
		"Descendant",
		"en Rappel",
		"sur Créature"
	],
	CompetenceData.Competence.ACROBATIE: [
		"Aérienne",
		"Sauts périlleux",
		"Chuter",
		"Contorsionniste"
	],
	
	# Athlétisme - Efforcer
	CompetenceData.Competence.POID: [
		"Tirer & Pousser",
		"Soulever & Ouvrir",
		"Porter",
		"Lancer",
		"Supporter (Équiper)"
	],
	CompetenceData.Competence.SAUT: [
		"Sans élan",
		"Précis",
		"en Longueur",
		"en Hauteur",
		"de Paroi",
		"à la Perche"
	],
	CompetenceData.Competence.NATATION: [
		"Plongeant",
		"Contre-courant",
		"de Compétition",
		"Flotter surplace",
		"Secourisme",
		"Bataille immergée"
	],
	
	# Athlétisme - Manœuvrer
	CompetenceData.Competence.VOL: [
		"Planer",
		"Piquer",
		"Flotter",
		"Poussée"
	],
	CompetenceData.Competence.FOUISSAGE: [
		"Viscosité & Liquides",
		"Sables & Granulaires",
		"Terres & Gravats",
		"Roches & Solides"
	],
	CompetenceData.Competence.CHEVAUCHEMENT: [
		"Montée en selle",
		"Déplacement monté",
		"Manœuvres montées",
		"Agissement monté"
	],
	
	# Charisme - Captiver
	CompetenceData.Competence.SEDUCTION: [
		"Attirer",
		"faire Émouvoir",
		"faire Admirer",
		"faire Reconnaître",
		"Avoir une Faveur",
		"Subvertir à la Déloyauté"
	],
	CompetenceData.Competence.MIMETISME: [
		"Sons naturels",
		"Êtres sauvages",
		"Accents & Dialectes",
		"Mimique",
		"Interprétation de rôle",
		"Déguisement"
	],
	CompetenceData.Competence.CHANT: [
		"de Poitrine",
		"de Tête/d'Appel",
		"Diphonique",
		"Improvisée",
		"de Mélodie",
		"en Chœur",
		"Ventriloque",
		"Sifflée"
	],
	
	# Charisme - Convaincre
	CompetenceData.Competence.NEGOCIATION: [
		"Marchandage",
		"Corrompre",
		"Diplomatie",
		"Débattre",
		"Enchèrir",
		"Renseignement"
	],
	CompetenceData.Competence.TROMPERIE: [
		"Belles-paroles",
		"Bobards",
		"Distraire",
		"Escroquer",
		"Railleries",
		"Troller"
	],
	CompetenceData.Competence.PRESENTATION: [
		"Première impression",
		"Bienséance",
		"Enseigner",
		"Réseauter",
		"Mode",
		"Rumeurs"
	],
	
	# Charisme - Interpréter
	CompetenceData.Competence.INSTRUMENTAL: [
		"Attirer",
		"faire Émouvoir",
		"faire Admirer",
		"faire Reconnaître",
		"Avoir une Faveur",
		"Subvertir à la Déloyauté"
	],
	CompetenceData.Competence.INSPIRATION: [
		"Apaiser",
		"Captiver",
		"Éduquer",
		"Camaraderie",
		"Festivité",
		"Fanatisme"
	],
	CompetenceData.Competence.NARRATION: [
		"Fabuleuse & Poétique",
		"Banalités",
		"Ragots & Rumeurs",
		"Propagande",
		"Plaisanteries",
		"Énigmes"
	],
	
	# Détection - Discerner
	CompetenceData.Competence.VISION: [
		"Précise & Distante",
		"Écritures",
		"Lecture sur lèvre",
		"Langage corporel"
	],
	CompetenceData.Competence.ESTIMATION: [
		"Valeur des Objets",
		"des Aptitudes",
		"des Arts",
		"de Contrebande",
		"de Recélage",
		"Fraude fiscale",
		"Comptabilité",
		"Administration"
	],
	CompetenceData.Competence.TOUCHER: [
		"Textures",
		"Températures",
		"Lectures à froid",
		"Reconnaissance aveugle"
	],
	
	# Détection - Découvrir
	CompetenceData.Competence.INVESTIGATION: [
		"Fouille",
		"Pistage",
		"Autopsie",
		"Décryptage",
		"Profilage",
		"Découverte",
		"Prospective"
	],
	CompetenceData.Competence.GOUT: [
		"Du Salé",
		"De l'Acide",
		"Du Sucré",
		"De l'Umami",
		"De l'Amer",
		"Culinaires",
		"Malaises",
		"Secrétions"
	],
	CompetenceData.Competence.RESSENTI: [
		"Temps & Climat",
		"Êtres sauvages",
		"Vérité",
		"Mentalisme",
		"Émotions & Motivations",
		"Se relater"
	],
	
	# Détection - Dépister
	CompetenceData.Competence.ODORAT: [
		"Parfums mélangés",
		"Airs sains & malsains",
		"Pistage",
		"Détection aveugle"
	],
	CompetenceData.Competence.AUDITION: [
		"Écoute & Murmures",
		"Sons naturels",
		"Apprentissage du parlé",
		"Écholocation"
	],
	CompetenceData.Competence.INTEROCEPTION: [
		"Équilibroception",
		"Proprioception",
		"Faim",
		"Soif",
		"Suffocation",
		"Empoisonnement",
		"Émotions",
		"Temporalité"
	],
	
	# Réflexion - Concevoir
	CompetenceData.Competence.ARTISANAT: [
		"Alimentaire",
		"des Graisses",
		"du Papier",
		"des Plantes",
		"du Textile",
		"du Cuir",
		"du Verre",
		"de la Construction",
		"des Métaux",
		"des Richesses",
		"du Bois",
		"de la Lutherie",
		"des Arts plastiques",
		"des Arts de dessein",
		"de la Récolte"
	],
	CompetenceData.Competence.MEDECINE: [
		"Diagnostiquer",
		"Thérapie",
		"Premiers soins",
		"Chirurgie",
		"Folies",
		"Poisons/Antipoisons"
	],
	CompetenceData.Competence.INGENIERIE: [
		"Civil",
		"Mécanique",
		"Chimique",
		"Énergique",
		"Mathématique",
		"Recherche académique"
	],
	
	# Réflexion - Acculturer
	CompetenceData.Competence.JEUX: [
		"Jeux d'Ambiance",
		"de Société",
		"de Hasard",
		"d'Esprit",
		"de Rôle",
		"Guide de jeu",
		"Arbitrage",
		"Conceptualisation",
		"Parier & Défier",
		"Compétition"
	],
	CompetenceData.Competence.SOCIETE: [
		"Rilique",
		"Préhistorique",
		"Folklorique",
		"Traditionnelle",
		"Internationale",
		"Linguistique",
		"Artistique",
		"Légale",
		"Illégale",
		"Entrepreneurial",
		"Économique",
		"des Équipements",
		"Militaire"
	],
	CompetenceData.Competence.GEOGRAPHIE: [
		"Localités",
		"Astronomie",
		"Climats",
		"Dangers naturels",
		"Milieux Désertiques",
		"Humides",
		"Tempérés",
		"Habités",
		"Souterrains",
		"Aquatiques",
		"Arboricoles",
		"Célestes"
	],
	
	# Réflexion - Acclimater
	CompetenceData.Competence.NATURE: [
		"Airs",
		"Minéraux",
		"Granulaires",
		"Eaux",
		"Neiges",
		"Arbres",
		"Herbes",
		"Racines",
		"Fungi",
		"Créatures Volatiles",
		"Terrestres",
		"Marines",
		"Infimes"
	],
	CompetenceData.Competence.PASTORALISME: [
		"Gouvernance",
		"Pâturage",
		"Manutention",
		"Marquage",
		"Traite",
		"Tonte",
		"Élevage",
		"Croisement",
		"Abattage",
		"Dressage"
	],
	CompetenceData.Competence.AGRONOMIE: [
		"Labourage",
		"Semailles",
		"Cultivation",
		"Moisson",
		"Produits",
		"Approvisionnement"
	],
	
	# Domination - Discipliner
	CompetenceData.Competence.COMMANDEMENT: [
		"Coup de fouet",
		"Se jeter à l'eau",
		"Retourner les poches",
		"Tirer les ficelles",
		"Lever les bâtons",
		"Dans le chaos",
		"La corde au cou",
		"Cracher les ordres",
		"Roi nu",
		"Duelliste"
	],
	CompetenceData.Competence.OBEISSANCE: [
		"Courber l'échine",
		"Se plier en quatre",
		"Lèche-botte",
		"Sauter sur la grenade",
		"Bouffer dans la main",
		"Suivre le troupeau",
		"Marquer sa chair",
		"S'adapter",
		"Mimer la bête"
	],
	CompetenceData.Competence.OBSTINANCE: [
		"Mains propres (Moralité)",
		"Ambitieuse (Motivation)",
		"Tête de mule (Personnalité)",
		"Respectueuse (Socialité)",
		"Fidèle (Disposition)",
		"Obsédée (Passion)",
		"Martyr"
	],
	
	# Domination - Endurer
	CompetenceData.Competence.GLOUTONNERIE: [
		"Capacité d'Aspiration",
		"Contrôle d'Aspiration",
		"Capacité d'Inhalation",
		"Contrôle d'Inhalation",
		"Capacité d'Expiration",
		"Contrôle d'Expiration",
		"Aspiration continue (sans reflux)"
	],
	CompetenceData.Competence.BEUVERIE: [
		"Capacité des Mâchoires",
		"d'Avalement d'Ingurgitation",
		"Capacité/Contrôle de Déglutition",
		"Résistance au textures Visqueuses",
		"Résistance au textures Granuleuses",
		"Résistance au textures Épineuses"
	],
	CompetenceData.Competence.ENTRAILLES: [
		"Résistance interne",
		"aux Inconfort",
		"à la Saleté",
		"Capacité d'Absorption cutanée",
		"d'Estomac",
		"Pulmonaire",
		"Vésicale",
		"Rectale"
	],
	
	# Domination - Dompter
	CompetenceData.Competence.INTIMIDATION: [
		"Par la Force (coup de pression)",
		"Torture",
		"Insulte",
		"Chantage",
		"Terreur",
		"Interrogatoire",
		"Tête-à-tête",
		"Regard noir",
		"Voix grave"
	],
	CompetenceData.Competence.APPRIVOISEMENT: [
		"Caresse",
		"Apaisement",
		"Friandise",
		"Main tendue",
		"Lire par le regard",
		"Habitude",
		"Apaiser",
		"Motiver",
		"Être Monté & Transporter",
		"Ordonnée",
		"à Combattre"
	],
	CompetenceData.Competence.DRESSAGE: [
		"Par Répétition",
		"Par Fouet",
		"Par Récompense",
		"Par Imitation",
		"en un(e) Bête/Être de jeu",
		"en un(e) Bête/Être de spectacle",
		"en un(e) Bête/Être de monte",
		"en un(e) Bête/Être de travail",
		"en un(e) Bête/Être de combat",
		"en un(e) Bête/Être de noblesse",
		"Marquage",
		"Esclavage",
		"Briser l'âme"
	]
}

## Get masteries for a competence
static func get_masteries(competence: CompetenceData.Competence) -> Array:
	return MASTERY_REGISTRY.get(competence, [])

## Get mastery count for a competence
static func get_mastery_count(competence: CompetenceData.Competence) -> int:
	var masteries: Array = MASTERY_REGISTRY.get(competence, [])
	return masteries.size()





