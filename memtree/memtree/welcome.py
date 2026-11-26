from item.models import Item


WELCOME_TEXT = (
    "Welcome to MemTree! / Добро пожаловать в MemTree!\n"
    "\n"
    "Это дерево текстовых заметок: каждая заметка может содержать вложенные заметки "
    "без ограничений по глубине.\n"
    "Начните с малого: нажмите «Add» и создайте свою первую заметку 🌱\n"
    "\n"
    "A tree of text notes: every note can hold nested notes with no depth limit.\n"
    "Start small: press «Add» and create your first note 🌱\n"
    "\n"
    "Подсказки — во вложенных заметках ниже / Tips are in the nested notes below."
)

WHY_TEXT = (
    "Зачем это приложение / What it is for\n"
    "\n"
    "Древовидная структура удобна для планов, идей, списков и любых иерархий: "
    "заметка может содержать вложенные заметки без ограничений по глубине.\n"
    "\n"
    "Tree structure is handy for plans, ideas, lists and any hierarchy: "
    "notes can nest as deep as you like."
)

CONTROLS_TEXT = (
    "Управление / Controls\n"
    "\n"
    "• Первый клик по элементу — зелёная подсветка (только один элемент за раз).\n"
    "• First click highlights the element in green (only one at a time).\n"
    "\n"
    "• Второй клик — жёлтая подсветка: можно выделить один или несколько элементов.\n"
    "• Second click — yellow highlight: select one or more elements.\n"
    "\n"
    "• «Add» без подсветки — новая заметка верхнего уровня; при зелёном элементе — вложенная заметка.\n"
    "• «Add» without highlighting — a new top-level note; with a green element — a nested note.\n"
    "\n"
    "• «Delete» в меню «Action» — удалить выделенные (жёлтые) элементы.\n"
    "• «Delete» in the «Action» menu — delete the selected (yellow) elements.\n"
    "\n"
    "• «Move» — перенести жёлтые элементы под зелёный родитель; если родитель не выбран — наверх дерева.\n"
    "• «Move» — move the yellow elements under the green parent; if no parent is selected — to the top of the tree.\n"
    "\n"
    "• «Edit» — включить или выключить редактирование текста заметок.\n"
    "• «Edit» — toggle editing of the note text on or off.\n"
    "\n"
    "• «Search» в шапке — поиск по заметкам.\n"
    "• «Search» in the header — search the notes."
)

NEXT_TEXT = (
    "Что дальше / Next steps\n"
    "\n"
    "• Экспорт и импорт заметок доступны в приложении в формате JSON — дерево целиком переносится туда и обратно.\n"
    "• Export and import of the whole tree is available in JSON format.\n"
    "\n"
    "Вопросы и пожелания / Questions and feedback: eugene.v.us@gmail.com"
)


def seed_welcome_items(user):
    """Create a small welcome tree for a freshly registered user."""
    welcome = Item.objects.create(user=user, text=WELCOME_TEXT, collapsed=False)
    for text in (WHY_TEXT, CONTROLS_TEXT, NEXT_TEXT):
        Item.objects.create(user=user, parent=welcome, text=text)
