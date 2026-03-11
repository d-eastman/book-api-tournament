#!/usr/bin/env python3
"""
Deterministic seed generator for Book API Tournament.
Generates seed-medium.sql (100 authors, 1000 books) and seed-large.sql (500 authors, 50000 books).
Uses random.Random(42) for reproducibility.
"""

import os
import random

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# The first 8 authors are always the small-seed authors (inserted verbatim from seed-small.sql)
SMALL_AUTHORS = [
    (1, "Octavia Butler", "American science fiction author known for blending African American spirituality with science fiction."),
    (2, "Toni Morrison", "Nobel Prize-winning novelist celebrated for her powerful exploration of Black identity and American history."),
    (3, "N.K. Jemisin", "First author to win the Hugo Award for Best Novel three years in a row for the Broken Earth trilogy."),
    (4, "James Baldwin", "Essayist and novelist whose works explored racial and social issues in America."),
    (5, "Ursula K. Le Guin", "American author best known for science fiction and fantasy works exploring gender, society, and political structures."),
    (6, "Haruki Murakami", "Japanese novelist known for surreal and dreamlike narratives blending the mundane with the fantastical."),
    (7, "Chimamanda Ngozi Adichie", "Nigerian author celebrated for her novels and essays exploring identity, feminism, and the immigrant experience."),
    (8, "Terry Pratchett", "British author best known for the Discworld series, a satirical fantasy series spanning over 40 novels."),
]

SMALL_BOOKS = [
    (1, "Kindred", 1, "Science Fiction", 1979, "A modern Black woman is transported back in time to the antebellum South where she must ensure the survival of a white slaveholder who is her ancestor."),
    (2, "Parable of the Sower", 1, "Science Fiction", 1993, "In a near-future California ravaged by climate change and inequality, a young woman with hyper-empathy syndrome founds a new faith."),
    (3, "Beloved", 2, "Literary Fiction", 1987, "A formerly enslaved woman is haunted by the ghost of her deceased daughter in post-Civil War Ohio."),
    (4, "Song of Solomon", 2, "Literary Fiction", 1977, "A young African American man journeys through the American South to uncover his family history and cultural identity."),
    (5, "The Fifth Season", 3, "Fantasy", 2015, "In a world plagued by catastrophic seismic events, a woman searches for her kidnapped daughter while civilization crumbles."),
    (6, "The City We Became", 3, "Urban Fantasy", 2020, "New York City comes alive as its boroughs are embodied by diverse avatars who must defend against an interdimensional threat."),
    (7, "Go Tell It on the Mountain", 4, "Literary Fiction", 1953, "A semi-autobiographical novel exploring a young boy's spiritual awakening in a Harlem church."),
    (8, "Giovanni's Room", 4, "Literary Fiction", 1956, "An American man in Paris grapples with his identity and love for an Italian bartender named Giovanni."),
    (9, "The Left Hand of Darkness", 5, "Science Fiction", 1969, "An envoy visits a planet whose inhabitants can change gender, exploring themes of identity and politics."),
    (10, "A Wizard of Earthsea", 5, "Fantasy", 1968, "A young wizard must confront a shadow creature he inadvertently released into the world."),
    (11, "Norwegian Wood", 6, "Literary Fiction", 1987, "A college student in 1960s Tokyo navigates love, loss, and the complexities of human connection."),
    (12, "Kafka on the Shore", 6, "Magical Realism", 2002, "Two intertwined narratives follow a runaway teenager and an elderly man who can talk to cats."),
    (13, "Americanah", 7, "Literary Fiction", 2013, "A young Nigerian woman navigates identity and race during her years in America before returning home."),
    (14, "Half of a Yellow Sun", 7, "Historical Fiction", 2006, "Set during the Nigerian Civil War, the lives of three characters intertwine amid political upheaval."),
    (15, "Going Postal", 8, "Fantasy", 2004, "A convicted con artist is given a choice between death and restoring the Ankh-Morpork Post Office."),
    (16, "Small Gods", 8, "Fantasy", 1992, "A tortoise who happens to be a god teams up with a simple novice to challenge the corrupt church built in his name."),
]

# --- Name pools ---
FIRST_NAMES = [
    "Elena", "Marcus", "Aisha", "David", "Yuki", "Carlos", "Priya", "Thomas",
    "Fatima", "James", "Mei", "Alexander", "Zara", "Omar", "Sofia", "Benjamin",
    "Nia", "Lucas", "Amara", "Daniel", "Lena", "Rafael", "Ingrid", "Kwame",
    "Hannah", "Dmitri", "Aaliya", "Patrick", "Chioma", "Henrik", "Nadia", "Samuel",
    "Kira", "Emmanuel", "Isolde", "Victor", "Ananya", "Felix", "Miriam", "Tariq",
    "Clara", "Javier", "Suki", "Andre", "Brigitte", "Kofi", "Lila", "Martin",
    "Reshma", "Olaf", "Celeste", "Ibrahim", "Astrid", "Pietro", "Vivian", "Akira",
    "Noemi", "Leroy", "Simone", "Ravi", "Aurora", "Chester", "Dalia", "Winston",
    "Camille", "Idris", "Eloise", "Naveen", "Margot", "Tobias", "Esperanza", "Callum",
    "Adele", "Haruto", "Valentina", "Desmond", "Saskia", "Andrei", "Freya", "Mateo",
]

LAST_NAMES = [
    "Okafor", "Chen", "Petrov", "Nakamura", "Johansson", "Da Silva", "Moreau",
    "Kim", "Ali", "Eriksson", "Okwu", "Tanaka", "Ivanova", "Santos", "Mueller",
    "Adeyemi", "Watanabe", "Lindgren", "Osei", "Martinez", "Bjornsson", "Chandra",
    "Dubois", "Park", "Volkov", "Afolabi", "Suzuki", "Bergman", "Mensah", "Reyes",
    "Andersen", "Krishnan", "Laurent", "Jang", "Kuznetsov", "Diallo", "Yamamoto",
    "Strand", "Asante", "Herrera", "Nilsson", "Sharma", "Fontaine", "Yoon", "Popov",
    "Bello", "Sato", "Holmberg", "Owusu", "Vargas", "Nordstrom", "Patel", "Beaumont",
    "Cho", "Fedorov", "Amadi", "Takahashi", "Lund", "Boateng", "Castillo", "Dahlgren",
    "Gupta", "Marchand", "Hwang", "Kozlov", "Eze", "Ito", "Lindqvist", "Appiah",
    "Delgado", "Magnusson", "Iyer", "Renard", "Bae", "Sokolov", "Nwosu", "Kobayashi",
]

NATIONALITIES = [
    "American", "British", "Canadian", "Australian", "Irish", "Nigerian", "Ghanaian",
    "South African", "Kenyan", "Indian", "Japanese", "Chinese", "Korean", "Brazilian",
    "Mexican", "Argentine", "Colombian", "French", "German", "Swedish", "Norwegian",
    "Russian", "Italian", "Spanish", "Dutch", "Polish", "Turkish", "Egyptian",
    "Ethiopian", "Jamaican", "Trinidadian", "Filipino", "Vietnamese", "Thai",
    "Indonesian", "Malaysian", "Pakistani", "Bangladeshi", "Sri Lankan", "Nepalese",
]

BIO_TEMPLATES = [
    "{nationality} novelist known for {adj} stories exploring {theme}.",
    "{nationality} author whose works blend {genre_lower} with explorations of {theme}.",
    "Award-winning {nationality} writer celebrated for {adj} narratives about {theme}.",
    "{nationality} novelist and essayist whose fiction examines {theme} with {adj} prose.",
    "Bestselling {nationality} author of {adj} novels that explore {theme}.",
    "{nationality} writer recognized for {adj} fiction addressing {theme}.",
    "Critically acclaimed {nationality} novelist known for {adj} explorations of {theme}.",
    "{nationality} author who has received international recognition for {adj} works on {theme}.",
    "Prolific {nationality} writer of {adj} fiction spanning themes of {theme}.",
    "{nationality} storyteller whose {adj} novels illuminate {theme}.",
]

BIO_ADJECTIVES = [
    "lyrical", "compelling", "thought-provoking", "evocative", "haunting",
    "intricate", "sweeping", "intimate", "vivid", "powerful", "nuanced",
    "ambitious", "inventive", "poignant", "gripping", "meditative",
    "luminous", "unflinching", "provocative", "richly layered",
]

BIO_THEMES = [
    "identity and belonging", "memory and loss", "family and tradition",
    "power and resistance", "love and betrayal", "culture and displacement",
    "justice and morality", "freedom and oppression", "nature and civilization",
    "war and peace", "faith and doubt", "ambition and consequence",
    "solitude and connection", "truth and deception", "hope and despair",
    "migration and home", "youth and aging", "art and creation",
    "science and ethics", "community and individuality",
]

GENRES = [
    "Literary Fiction", "Science Fiction", "Fantasy", "Historical Fiction",
    "Mystery", "Thriller", "Romance", "Horror", "Magical Realism",
    "Dystopian", "Adventure", "Satire", "Gothic Fiction", "Urban Fantasy",
    "Crime Fiction", "Psychological Fiction",
]

GENRE_LOWER_MAP = {
    "Literary Fiction": "literary fiction",
    "Science Fiction": "science fiction",
    "Fantasy": "fantasy",
    "Historical Fiction": "historical fiction",
    "Mystery": "mystery",
    "Thriller": "suspense",
    "Romance": "romance",
    "Horror": "horror",
    "Magical Realism": "magical realism",
    "Dystopian": "dystopian fiction",
    "Adventure": "adventure",
    "Satire": "satire",
    "Gothic Fiction": "gothic fiction",
    "Urban Fantasy": "urban fantasy",
    "Crime Fiction": "crime fiction",
    "Psychological Fiction": "psychological fiction",
}

TITLE_PATTERNS = [
    "The {noun} of {place}",
    "A {adj} {noun}",
    "The {adj} {noun}",
    "{noun} and {noun2}",
    "The Last {noun}",
    "Under the {adj} {noun}",
    "Beyond the {noun}",
    "The {noun}",
    "A {noun} in {place}",
    "{adj} {noun}",
    "The {noun} of {noun2}",
    "When the {noun} {verb}",
    "Before the {noun}",
    "After the {adj} {noun}",
    "The Book of {noun}",
    "Songs of {noun}",
    "The {adj} Garden",
    "Whispers of {noun}",
    "The {noun} Keeper",
    "Children of {noun}",
    "House of {noun}",
    "The Weight of {noun}",
    "River of {noun}",
    "City of {adj} {noun}",
    "The {noun} Chronicles",
]

TITLE_NOUNS = [
    "Shadow", "Light", "Storm", "Silence", "Fire", "Stone", "Wind", "Star",
    "River", "Mountain", "Ocean", "Forest", "Rain", "Thunder", "Dawn", "Dusk",
    "Mirror", "Bridge", "Tower", "Gate", "Crown", "Sword", "Flame", "Frost",
    "Dust", "Iron", "Silver", "Glass", "Bone", "Blood", "Dream", "Mist",
    "Ember", "Ash", "Night", "Tide", "Echo", "Haven", "Ruin", "Thorn",
    "Silk", "Salt", "Honey", "Ivory", "Copper", "Moss", "Amber", "Pearl",
    "Willow", "Cedar", "Orchid", "Serpent", "Raven", "Wolf", "Falcon", "Lotus",
]

TITLE_NOUNS2 = [
    "Shadows", "Stars", "Roses", "Thorns", "Ashes", "Embers", "Whispers",
    "Echoes", "Dreams", "Secrets", "Memories", "Storms", "Sorrow", "Glory",
    "Ruin", "Hope", "Silence", "Lightning", "Dust", "Bones", "Fire", "Ice",
    "Time", "Fate", "Darkness", "Light", "Stone", "Water", "Glass", "Steel",
]

TITLE_ADJECTIVES = [
    "Silent", "Broken", "Golden", "Crimson", "Forgotten", "Hidden", "Eternal",
    "Dark", "Bright", "Hollow", "Sacred", "Wild", "Distant", "Burning", "Frozen",
    "Pale", "Shattered", "Ancient", "Lost", "Fallen", "Iron", "Silver", "Velvet",
    "Midnight", "Winding", "Bitter", "Gentle", "Fading", "Luminous", "Restless",
]

TITLE_PLACES = [
    "Nowhere", "Elsewhere", "the North", "the South", "the Sea",
    "the Mountains", "the Desert", "the Valley", "the Marshes", "Eden",
    "Arcadia", "the Ruins", "the Empire", "the Kingdom", "the Wasteland",
    "the Frontier", "the Abyss", "the Highlands", "the Lowlands", "Atlantis",
]

TITLE_VERBS = [
    "Falls", "Burns", "Breaks", "Rises", "Fades", "Returns", "Sleeps",
    "Wakes", "Sings", "Weeps", "Calls", "Ends", "Begins", "Speaks", "Waits",
]

DESC_TEMPLATES = [
    "A {adj} tale of {character} who must {quest} in a world where {setting}.",
    "When {character} discovers {discovery}, {pronoun} is drawn into a {adj} journey through {place}.",
    "In {place}, {character} faces {conflict} while searching for {goal}.",
    "A {adj} story following {character} as {pronoun} navigates {conflict} and discovers {discovery}.",
    "Set in {place}, this {adj} novel follows {character} through a landscape of {theme}.",
    "{character} embarks on a {adj} quest to {quest}, confronting {conflict} along the way.",
    "A {adj} exploration of {theme} through the eyes of {character} in {place}.",
    "When {conflict} threatens {place}, {character} must {quest} before it is too late.",
    "In this {adj} narrative, {character} grapples with {theme} while {quest_gerund} in {place}.",
    "The story of {character} who, after {discovery}, must confront {conflict} in {place}.",
]

DESC_ADJECTIVES = [
    "sweeping", "intimate", "gripping", "haunting", "luminous", "compelling",
    "vivid", "powerful", "lyrical", "unforgettable", "thought-provoking",
    "mesmerizing", "richly woven", "deeply moving", "spellbinding",
    "evocative", "masterful", "poignant", "breathtaking", "nuanced",
]

DESC_CHARACTERS = [
    "a young scholar", "an aging professor", "a war veteran", "a gifted musician",
    "a reluctant hero", "a disgraced noble", "an orphaned child", "a traveling merchant",
    "a retired detective", "a village healer", "an ambitious journalist", "a lonely artist",
    "a wandering poet", "a seasoned diplomat", "a rebellious student", "a shipwrecked sailor",
    "a court librarian", "a fugitive alchemist", "a widowed farmer", "a street performer",
    "a temple guardian", "a colonial administrator", "a frontier doctor", "a clockmaker",
    "an exiled princess", "a lighthouse keeper", "a cartographer", "a war correspondent",
    "a blind musician", "a monastery scribe",
]

DESC_QUESTS = [
    "uncover a long-buried truth", "find a way home across hostile territory",
    "solve a mystery that has haunted generations", "protect those who cannot protect themselves",
    "forge an unlikely alliance", "reclaim what was stolen from their people",
    "decode an ancient manuscript", "survive a journey through uncharted lands",
    "confront the ghosts of their past", "build something lasting from the ruins",
    "navigate a web of political intrigue", "preserve a dying language and culture",
    "reconcile with a long-estranged family", "expose a dangerous conspiracy",
    "find meaning in an increasingly chaotic world",
]

DESC_QUEST_GERUNDS = [
    "uncovering long-buried truths", "navigating treacherous alliances",
    "searching for answers", "rebuilding from the ashes of war",
    "crossing cultural boundaries", "challenging ancient traditions",
    "forging a new path", "preserving what remains of the old world",
    "seeking redemption", "fighting for survival",
]

DESC_CONFLICTS = [
    "betrayal from within", "an ancient curse", "the collapse of an empire",
    "a devastating plague", "political upheaval", "a generations-old feud",
    "the threat of invasion", "a crisis of faith", "social revolution",
    "environmental catastrophe", "a power struggle", "cultural erasure",
    "a web of lies and deception", "the weight of expectation", "a forbidden truth",
]

DESC_DISCOVERIES = [
    "a hidden inheritance", "a forbidden manuscript", "a secret identity",
    "an impossible truth", "a map to a lost city", "a family secret spanning generations",
    "evidence of an ancient civilization", "a message from the past",
    "a talent that defies explanation", "the true cost of power",
]

DESC_SETTINGS = [
    "nothing is as it seems", "old alliances are crumbling",
    "magic comes at a terrible price", "the past refuses to stay buried",
    "tradition and progress collide", "borders are shifting",
    "an ancient prophecy is unfolding", "revolution simmers beneath the surface",
    "the natural order is unraveling", "two cultures clash at a crossroads",
]

DESC_PLACES = [
    "a war-torn country", "a remote mountain village", "a sprawling coastal city",
    "a decaying colonial estate", "a vibrant metropolitan center",
    "a drought-stricken farming community", "an isolated island",
    "a divided border town", "a prestigious university", "a crumbling empire",
    "a bustling market town", "the frozen northern territories",
    "a sun-baked desert outpost", "a fog-shrouded port city",
    "a rapidly changing metropolis",
]

DESC_THEMES = [
    "love and loss", "identity and belonging", "power and corruption",
    "memory and forgetting", "faith and doubt", "freedom and sacrifice",
    "war and its aftermath", "tradition and change", "justice and mercy",
    "ambition and regret", "truth and illusion", "exile and return",
]


def sql_escape(s: str) -> str:
    """Escape single quotes for SQL."""
    return s.replace("'", "''")


def generate_author_name(rng: random.Random, used_names: set) -> str:
    """Generate a unique author name."""
    for _ in range(1000):
        first = rng.choice(FIRST_NAMES)
        last = rng.choice(LAST_NAMES)
        name = f"{first} {last}"
        if name not in used_names:
            used_names.add(name)
            return name
    raise RuntimeError("Could not generate unique author name")


def generate_author_bio(rng: random.Random) -> str:
    """Generate a random author bio."""
    template = rng.choice(BIO_TEMPLATES)
    nationality = rng.choice(NATIONALITIES)
    adj = rng.choice(BIO_ADJECTIVES)
    theme = rng.choice(BIO_THEMES)
    genre = rng.choice(GENRES)
    genre_lower = GENRE_LOWER_MAP.get(genre, genre.lower())
    return template.format(
        nationality=nationality,
        adj=adj,
        theme=theme,
        genre_lower=genre_lower,
    )


def generate_book_title(rng: random.Random, used_titles: set) -> str:
    """Generate a unique book title."""
    for _ in range(100):
        pattern = rng.choice(TITLE_PATTERNS)
        title = pattern.format(
            noun=rng.choice(TITLE_NOUNS),
            noun2=rng.choice(TITLE_NOUNS2),
            adj=rng.choice(TITLE_ADJECTIVES),
            place=rng.choice(TITLE_PLACES),
            verb=rng.choice(TITLE_VERBS),
        )
        if title not in used_titles:
            used_titles.add(title)
            return title
    # If we can't find a unique title, add a volume number
    for vol in range(2, 1000):
        candidate = f"{title}, Vol. {vol}"
        if candidate not in used_titles:
            used_titles.add(candidate)
            return candidate
    raise RuntimeError("Could not generate unique book title")


def generate_book_description(rng: random.Random) -> str:
    """Generate a random book description."""
    template = rng.choice(DESC_TEMPLATES)
    pronoun = rng.choice(["he", "she", "they"])
    return template.format(
        adj=rng.choice(DESC_ADJECTIVES),
        character=rng.choice(DESC_CHARACTERS),
        quest=rng.choice(DESC_QUESTS),
        quest_gerund=rng.choice(DESC_QUEST_GERUNDS),
        setting=rng.choice(DESC_SETTINGS),
        pronoun=pronoun,
        place=rng.choice(DESC_PLACES),
        conflict=rng.choice(DESC_CONFLICTS),
        goal=rng.choice(DESC_QUESTS),
        discovery=rng.choice(DESC_DISCOVERIES),
        theme=rng.choice(DESC_THEMES),
    )


def generate_seed(num_authors: int, num_books: int, output_file: str):
    """Generate a seed SQL file with the given number of authors and books."""
    rng = random.Random(42)

    used_names = set()
    used_titles = set()

    # Start with small-seed authors
    authors = list(SMALL_AUTHORS)
    for _, name, _ in SMALL_AUTHORS:
        used_names.add(name)

    # Generate additional authors
    for author_id in range(len(SMALL_AUTHORS) + 1, num_authors + 1):
        name = generate_author_name(rng, used_names)
        bio = generate_author_bio(rng)
        authors.append((author_id, name, bio))

    # Start with small-seed books
    books = list(SMALL_BOOKS)
    for _, title, _, _, _, _ in SMALL_BOOKS:
        used_titles.add(title)

    # Generate additional books
    for book_id in range(len(SMALL_BOOKS) + 1, num_books + 1):
        title = generate_book_title(rng, used_titles)
        author_id = rng.randint(1, num_authors)
        genre = rng.choice(GENRES)
        year = rng.randint(1900, 2024)
        description = generate_book_description(rng)
        books.append((book_id, title, author_id, genre, year, description))

    # Write SQL
    with open(output_file, "w") as f:
        f.write(f"-- Generated seed: {num_authors} authors, {num_books} books\n")
        f.write(f"-- Deterministic (seed=42). Regenerate with: python3 db/generate-seeds.py\n\n")

        f.write("-- Authors\n")
        for author_id, name, bio in authors:
            name_escaped = sql_escape(name)
            bio_escaped = sql_escape(bio)
            f.write(
                f"INSERT INTO authors (id, name, bio) VALUES "
                f"({author_id}, '{name_escaped}', '{bio_escaped}');\n"
            )

        f.write("\n-- Books\n")
        for book_id, title, author_id, genre, year, description in books:
            title_escaped = sql_escape(title)
            genre_escaped = sql_escape(genre)
            description_escaped = sql_escape(description)
            f.write(
                f"INSERT INTO books (id, title, author_id, genre, year, description) VALUES "
                f"({book_id}, '{title_escaped}', {author_id}, '{genre_escaped}', {year}, '{description_escaped}');\n"
            )

    print(f"Generated {output_file}: {num_authors} authors, {num_books} books")


def main():
    medium_path = os.path.join(SCRIPT_DIR, "seed-medium.sql")
    large_path = os.path.join(SCRIPT_DIR, "seed-large.sql")

    generate_seed(100, 1000, medium_path)
    generate_seed(500, 50000, large_path)


if __name__ == "__main__":
    main()
