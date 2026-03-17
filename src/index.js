import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card instanceof Duck;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}


class Creature extends Card {
    constructor(name, power) {
        super(name, power);
    }
    getDescriptions() {
        return [getCreatureDescription(this), ...super.getDescriptions()];
    }
}
// Основа для утки.
class Duck extends Creature {
    constructor(name = "Утка", power = 2) {
        super(name, power);
    }

    quacks() {
        console.log('quack')
    };

    swims() {
        console.log('float: both;')
    };
}

// Основа для собаки.
class Dog extends Creature {
    constructor(name = "Собака", power = 3) {
        super(name, power);
    }
}

class Trasher extends Dog {
    constructor() {
        super("Громила", 5);
    }
    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        if (value - 1 > 0){
            this.view.signalAbility(() => {})
        }
        const reducedDamage = Math.max(value - 1, 0);
        continuation(reducedDamage);
    }
    getDescriptions() {
        return ["Способность: уменьшает урон на 1", ...super.getDescriptions()];
    }
}
class Lad extends Dog {
    constructor() {
        super("Браток", 2);
    }
    static getInGameCount() { return this.inGameCount || 0; }
    static setInGameCount(value) { this.inGameCount = value; }
    static getBonus() {
        const count = this.getInGameCount();
        return count * (count + 1) / 2;
    }
    doAfterComingIntoPlay(gameContext, continuation) {
        const currentCount = Lad.getInGameCount();
        Lad.setInGameCount(currentCount + 1);
        if (super.doAfterComingIntoPlay) {
            super.doAfterComingIntoPlay(gameContext, continuation);
        } else {
            continuation();
        }
    }

    doBeforeRemoving(continuation) {
        const currentCount = Lad.getInGameCount();
        Lad.setInGameCount(Math.max(0, currentCount - 1));
        if (super.doBeforeRemoving) {
            super.doBeforeRemoving(continuation);
        } else {
            continuation();
        }
    }
    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        const bonus = Lad.getBonus();
        continuation(value + bonus);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        const bonus = Lad.getBonus();
        continuation(Math.max(0, value - bonus));
    }
    getDescriptions() {
        const hasModifyDealed = this.modifyDealedDamageToCreature !== Card.prototype.modifyDealedDamageToCreature;
        const hasModifyTaken = this.modifyTakenDamage !== Card.prototype.modifyTakenDamage;

        let descriptions = super.getDescriptions();

        if (hasModifyDealed || hasModifyTaken) {
            descriptions.push("Чем их больше, тем они сильнее");
        }

        return descriptions;
    }
}

class Gatling extends Creature {
    constructor() {
        super("Гатлинг", 6);
    }
    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {oppositePlayer} = gameContext;

        taskQueue.push(onDone => this.view.showAttack(onDone));
        for (let oppositeCard of oppositePlayer.table) {
            if (oppositeCard) {
                taskQueue.push(onDone => {
                    this.dealDamageToCreature(2, oppositeCard, gameContext, onDone);
                });
            }
        }
        taskQueue.continueWith(continuation);
    }
    getDescriptions() {
        return [...super.getDescriptions(), "Способность: При атаке наносит урон на 2 весм картам противника"];
    }
}

// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Lad(),
    new Lad(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
