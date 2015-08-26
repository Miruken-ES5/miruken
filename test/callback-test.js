var miruken  = require('../lib/miruken.js'),
    callback = require('../lib/callback.js'),
    Promise  = require('bluebird'),
    chai     = require("chai"),
    expect   = chai.expect;

eval(base2.namespace);
eval(miruken.namespace);
eval(callback.namespace);

new function () { // closure

    var callback_test = new base2.Package(this, {
        name:    "callback_test",
        exports: "Guest,Dealer,PitBoss,DrinkServer,Game,Security,Level1Security,Level2Security,WireMoney,CountMoney,Accountable,Cashier,Activity,CardTable,Casino"
    });

    eval(this.imports);

    var Guest = Base.extend({
        $properties: {
            age: 0
        },
        constructor: function (age) {
            this.age = age;
        }
    });

    var Dealer = Base.extend({
        shuffle: function (cards) {
            return cards.sort(function () {
                    return 0.5 - Math.random();
                });
        }
    });

    var PitBoss = Base.extend({
        $properties: {
            name: ''
        },
        constructor: function (name) {
            this.name = name;
        }
    });

    var DrinkServer = Base.extend({
    });

    var Game = Protocol.extend({
        open: function (numPlayers) {}
    });

    var Security = Protocol.extend({
        admit: function (guest) {},
        trackActivity: function (activity) {},
        scan: function () {}
    });

    var Level1Security = Base.extend(Security, {
        admit: function (guest) {
            return guest.age >= 21;
        }
    });

    var Level2Security = Base.extend(Security, {
        trackActivity: function (activity) {
            console.log(lang.format("Tracking '%1'", activity.name));
        },
        scan: function () {
            return Promise.delay(true, 2);
        }
    });

    var WireMoney = Base.extend({
        $properties: {
            requested: 0.0,
            received:  0.0
        },
        constructor: function (requested) {
            this.requested = requested;
        }
    });

    var CountMoney = Base.extend({
        constructor: function () {
            var _total = 0.0;
            this.extend({
                getTotal: function () { return _total; },
                record:   function (amount) { _total += amount; }
            });
        }
    });

    var Accountable = Base.extend($callbacks, {
        constructor: function (assets, liabilities) {
            assets      = Number(assets || 0);
            liabilities = Number(liabilities || 0);
            this.extend({
                getAssets:       function () { return assets; },
                getLiabilities:  function () { return liabilities; },
                getBalance:      function () { return assets - liabilities; },
                addAssets:       function (amount) { assets      += amount; },
                addLiabilities:  function (amount) { liabilities += amount; },
                transfer:        function (amount, receiver) {
                    assets -= amount;
                    if (assets < 0) {
                        liabilties -= assets;
                        assets      = 0;
                    }
                    receiver.addAssets(amount);
                    return Promise.delay(100);
                }
            });
        },
        $handle:[
            CountMoney, function (countMoney, composer) {
                countMoney.record(this.getBalance());
            }]
    });

    var Cashier = Accountable.extend({
        toString: function () { return 'Cashier $' + this.getBalance(); },
        $handle:[
            WireMoney, function (wireMoney, composer) {
                wireMoney.received = wireMoney.requested;
                return Promise.resolve(wireMoney);
            }]
    });

    var Activity = Accountable.extend({
        $properties: {
            name: ''
        },
        constructor: function (name) {
            this.base();
            this.name = name;
        },
        toString: function () { return 'Activity ' + this.name; }
    });

    var CardTable = Activity.extend(Game, {
        constructor: function (name, minPlayers, maxPlayers) {
            this.base(name);
            this.extend({
                open: function (numPlayers) {
                    if (minPlayers > numPlayers || numPlayers > maxPlayers)
                        return $NOT_HANDLED;
                },
            });
        }
    });

    var Casino = CompositeCallbackHandler.extend({
        $properties: {
            name: ''
        },
        constructor: function (name) {
            this.base();
            this.name = name;
        },
        toString: function () { return 'Casino ' + this.name; },

        $provide:[
            PitBoss, function (composer) {
                return new PitBoss('Freddy');
            },

            DrinkServer, function (composer) {
                return Promise.delay(new DrinkServer(), 100);
            }]
    });

  eval(this.exports);
};

eval(base2.callback_test.namespace);

describe("HandleMethod", function () {
    describe("#getType", function () {
        it("should get the method type", function () {
            var method = new HandleMethod(HandleMethod.Invoke, undefined, "deal", [[1,3,8], 2]);
            expect(method.getType()).to.equal(HandleMethod.Invoke);
        });
    });

    describe("#getMethodName", function () {
        it("should get the method name", function () {
            var method = new HandleMethod(HandleMethod.Invoke, undefined, "deal", [[1,3,8], 2]);
            expect(method.getMethodName()).to.equal("deal");
        });
    });

    describe("#getArguments", function () {
        it("should get the method arguments", function () {
            var method = new HandleMethod(HandleMethod.Invoke, undefined, "deal", [[1,3,8], 2]);
            expect(method.getArguments()).to.eql([[1,3,8], 2]);
        });

        it("should be able to change arguments", function () {
            var method = new HandleMethod(HandleMethod.Invoke, undefined, "deal", [[1,3,8], 2]);
            method.getArguments()[0] = [2,4,8];
            expect(method.getArguments()).to.eql([[2,4,8], 2]);
        });
    });

    describe("#getReturnValue", function () {
        it("should get the return value", function () {
            var method = new HandleMethod(HandleMethod.Invoke, undefined, "deal", [[1,3,8], 2]);
            method.setReturnValue([1,8]);
            expect(method.getReturnValue()).to.eql([1,8]);
        });
    });

    describe("#setReturnValue", function () {
        it("should set the return value", function () {
            var method = new HandleMethod(HandleMethod.Invoke, undefined, "deal", [[1,3,8], 2]);
            method.setReturnValue([1,8]);
            expect(method.getReturnValue()).to.eql([1,8]);
        });
    });

    describe("#invokeOn", function () {
        it("should invoke method on target", function () {
            var dealer  = new Dealer,
                method  = new HandleMethod(HandleMethod.Invoke, undefined, "shuffle", [[22,19,9,14,29]]),
                handled = method.invokeOn(dealer);
            expect(handled).to.be.true;
            expect(method.getReturnValue()).to.have.members([22,19,9,14,29]);
        });

        it("should call getter on target", function () {
            var guest   = new Guest(12),
                method  = new HandleMethod(HandleMethod.Get, undefined, "age"),
                handled = method.invokeOn(guest);
            expect(handled).to.be.true;
            expect(method.getReturnValue()).to.equal(12);
        });

        it("should call setter on target", function () {
            var guest   = new Guest(12),
                method  = new HandleMethod(HandleMethod.Set, undefined, "age", 18),
                handled = method.invokeOn(guest);
            expect(handled).to.be.true;
            expect(method.getReturnValue()).to.equal(18);
            expect(guest.age).to.equal(18);
        });
    });
});

describe("Definitions", function () {
    describe("$define", function () {
        it("should require non-empty tag", function () {
            $define('$foo');
            expect(function () {
                $define();
            }).to.throw(Error, "The tag must be a non-empty string with no whitespace.");
            expect(function () {
                $define("");
            }).to.throw(Error, "The tag must be a non-empty string with no whitespace.");
            expect(function () {
                $define("  ");
            }).to.throw(Error, "The tag must be a non-empty string with no whitespace.");
        });

        it("should prevent same tag from being registered", function () {
            $define('$bar');
            expect(function () {
                $define('$bar');
            }).to.throw(Error, "'$bar' is already defined.");
        });

        it("Should accept variance option", function () {
            var baz = $define('$baz', Variance.Contravariant);
        expect(baz).to.be.ok;
        });

        it("Should reject invalid variance option", function () {
            expect(function () {
        $define('$buz', { variance: 1000 });
            }).to.throw(Error, "Variance must be Covariant, Contravariant or Invariant");
        });
    });

    describe("#list", function () {
        it("should create $meta.$handle key when first handler registered", function () {
            var handler    = new CallbackHandler;
            $handle(handler, True, True);
            expect(handler.$meta.$handle).to.be.ok;
        });

        it("should maintain linked-list of handlers", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {};
            $handle(handler, Activity, nothing);
            $handle(handler, Accountable, nothing);
            $handle(handler, Game, nothing);
            expect(handler.$meta.$handle.head.constraint).to.equal(Activity);
            expect(handler.$meta.$handle.head.next.constraint).to.equal(Accountable);
            expect(handler.$meta.$handle.tail.prev.constraint).to.equal(Accountable);
            expect(handler.$meta.$handle.tail.constraint).to.equal(Game);
        });

        it("should order $handle contravariantly", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {};
            $handle(handler, Accountable, nothing);
            $handle(handler, Activity, nothing);
            expect(handler.$meta.$handle.head.constraint).to.equal(Activity);
            expect(handler.$meta.$handle.tail.constraint).to.equal(Accountable);
        });

        it("should order $handle invariantly", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                something   = function (callback) {};
            $handle(handler, Activity, nothing);
            $handle(handler, Activity, something);
            expect(handler.$meta.$handle.head.handler).to.equal(nothing);
            expect(handler.$meta.$handle.tail.handler).to.equal(something);
        });

        it("should order $provide covariantly", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {};
            $provide(handler, Activity, nothing);
            $provide(handler, Accountable, nothing);
            expect(handler.$meta.$provide.head.constraint).to.equal(Accountable);
            expect(handler.$meta.$provide.tail.constraint).to.equal(Activity);
        });

        it("should order $provide invariantly", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                something   = function (callback) {};
            $provide(handler, Activity, nothing);
            $provide(handler, Activity, something);
            expect(handler.$meta.$provide.head.handler).to.equal(nothing);
            expect(handler.$meta.$provide.tail.handler).to.equal(something);
        });

        it("should order $lookup invariantly", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                something   = function (callback) {};
            $lookup(handler, Activity, nothing);
            $lookup(handler, Activity, something);
            expect(handler.$meta.$lookup.head.handler).to.equal(nothing);
            expect(handler.$meta.$lookup.tail.handler).to.equal(something);
        });

        it("should index first registered handler with head and tail", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                unregister  = $handle(handler, True, nothing);
            expect(unregister).to.be.a('function');
            expect(handler.$meta.$handle.head.handler).to.equal(nothing);
            expect(handler.$meta.$handle.tail.handler).to.equal(nothing);
        });

        it("should call function when handler removed", function () {
            var handler        = new CallbackHandler,
                func           = function (callback) {},
                handlerRemoved = false,
                unregister     = $handle(handler, True, func, function () {
                    handlerRemoved = true;
                });
            unregister();
            expect(handlerRemoved).to.be.true;
            expect(handler.$meta.$handle).to.be.undefined;
        });

        it("should suppress handler removed if requested", function () {
            var handler        = new CallbackHandler,
                func           = function (callback) {},
                handlerRemoved = false,
                unregister     = $handle(handler, True, func, function () {
                    handlerRemoved = true;
                });
            unregister(false);
            expect(handlerRemoved).to.be.false;
            expect(handler.$meta.$handle).to.be.undefined;
        });

        it("should remove $handle when no handlers remain", function () {
            var handler     = new CallbackHandler,
                func        = function (callback) {},
                unregister  = $handle(handler, True, func);
            unregister();
            expect(handler.$meta.$handle).to.be.undefined;
        });
    });

    describe("#index", function () {
        it("should index class constraints using assignID", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                index       = assignID(Activity);
            $handle(handler, Activity, nothing);
            expect(handler.$meta.$handle.getIndex(index).constraint).to.equal(Activity);
        });

        it("should index protocol constraints using assignID", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                index       = assignID(Game);
            $handle(handler, Game, nothing);
            expect(handler.$meta.$handle.getIndex(index).constraint).to.equal(Game);
        });

        it("should index string constraints using string", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {};
            $handle(handler, "something", nothing);
            expect(handler.$meta.$handle.getIndex("something").handler).to.equal(nothing);
        });

        it("should move index to next match", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                something   = function (callback) {},
                index       = assignID(Activity),
                unregister  = $handle(handler, Activity, nothing);
            $handle(handler, Activity, something);
            expect(handler.$meta.$handle.getIndex(index).handler).to.equal(nothing);
            unregister();
            expect(handler.$meta.$handle.getIndex(index).handler).to.equal(something);
        });

        it("should remove index when no more matches", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                index       = assignID(Activity);
            $handle(handler, Accountable, nothing);
            var unregister  = $handle(handler, Activity, nothing);
            unregister();
            expect(handler.$meta.$handle.getIndex(index)).to.be.undefined;
        });
    });

    describe("#removeAll", function () {
        it("should remove all $handler definitions", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
            removeCount = 0,
            removed     = function () { ++removeCount; };
            $handle(handler, Accountable, nothing, removed);
            $handle(handler, Activity, nothing, removed);
        $handle.removeAll(handler);
        expect(removeCount).to.equal(2);
            expect(handler.$meta.$handle).to.be.undefined;
        });

        it("should remove all $provider definitions", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
            removeCount = 0,
            removed     = function () { ++removeCount; };
            $provide(handler, Activity, nothing, removed);
            $provide(handler, Accountable, nothing, removed);
        $provide.removeAll(handler);
        expect(removeCount).to.equal(2);
            expect(handler.$meta.$provide).to.be.undefined;
        });
    });
});

describe("CallbackHandler", function () {
    describe("#handle", function () {
        it("should not handle nothing", function () {
            var casino     = new Casino;
            expect(casino.handle()).to.be.false;
            expect(casino.handle(null)).to.be.false;
        });

        it("should not handle anonymous objects", function () {
            var casino     = new Casino;
            expect(casino.handle({name:'Joe'})).to.be.false;
        });

        it("should handle callbacks", function () {
            var cashier    = new Cashier(1000000.00),
                casino     = new Casino('Belagio').addHandlers(cashier),
                countMoney = new CountMoney;
            expect(casino.handle(countMoney)).to.be.true;
            expect(countMoney.getTotal()).to.equal(1000000.00);
        });

        it("should handle callbacks per instance", function () {
            var cashier    = new Cashier(1000000.00),
                handler    = new CallbackHandler;
            $handle(handler, Cashier, function (cashier) {
                this.cashier = cashier;
            });
            expect(handler.handle(cashier)).to.be.true;
            expect(handler.cashier).to.equal(cashier);
        });

        it("should handle callback hierarchy", function () {
            var cashier    = new Cashier(1000000.00),
                inventory  = new (CallbackHandler.extend({
                    $handle:[
                        Accountable, function (accountable) {
                            this.accountable = accountable;
                        }]
                }));
            expect(inventory.handle(cashier)).to.be.true;
            expect(inventory.accountable).to.equal(cashier);
        });

        it("should ignore callback if $NOT_HANDLED", function () {
            var cashier    = new Cashier(1000000.00),
                inventory  = new (CallbackHandler.extend({
                    $handle:[
                        Cashier, function (cashier) {
                            return $NOT_HANDLED;
                        }]
                }));
            expect(inventory.handle(cashier)).to.be.false;
        });

        it("should handle callback invariantly", function () {
            var cashier     = new Cashier(1000000.00),
                accountable = new Accountable(1.00),
                inventory   = new (CallbackHandler.extend({
                    $handle:[
                        $eq(Accountable), function (accountable) {
                            this.accountable = accountable;
                        }]
                }));
            expect(inventory.handle(cashier)).to.be.false;
            expect(inventory.handle(accountable)).to.be.true;
            expect(inventory.accountable).to.equal(accountable);
            $handle(inventory, Accountable, function (accountable) {
                this.accountable = accountable;
            });
            expect(inventory.handle(cashier)).to.be.true;
            expect(inventory.accountable).to.equal(cashier);
        });

        it("should stop early if handle callback invariantly", function () {
            var cashier     = new Cashier(1000000.00),
                accountable = new Accountable(1.00),
                inventory   = new (CallbackHandler.extend({
                    $handle:[
                        Accountable, function (accountable) {
                        },
                        null, function (anything) {
                        }]
                }));
            expect(inventory.handle($eq(accountable))).to.be.true;
            expect(inventory.handle($eq(cashier))).to.be.false;
        });

        it("should handle callback protocol conformance", function () {
            var blackjack  = new CardTable('Blackjack'),
                inventory  = new (CallbackHandler.extend({
                    $handle:[
                        Game, function (game) {
                            this.game = game;
                        }]
                }));
            expect(inventory.handle(blackjack)).to.be.true;
            expect(inventory.game).to.equal(blackjack);
        });

        it("should prefer callback hierarchy over protocol conformance", function () {
            var blackjack  = new CardTable('Blackjack'),
                inventory  = new (CallbackHandler.extend({
                    $handle:[
                        Activity, function (activity) {
                            this.activity = activity;
                        },
                        Game, function (game) {
                            this.game = game;
                        }]
                }));
            expect(inventory.handle(blackjack)).to.be.true;
            expect(inventory.activity).to.equal(blackjack);
            expect(inventory.game).to.be.undefined;
        });

        it("should prefer callback hierarchy and continue with protocol conformance", function () {
            var blackjack  = new CardTable('Blackjack'),
                inventory  = new (CallbackHandler.extend({
                    $handle:[
                        Activity, function (activity) {
                            this.activity = activity;
                            return false;
                        },
                        Game, function (game) {
                            this.game = game;
                        }]
                    }));
            expect(inventory.handle(blackjack)).to.be.true;
            expect(inventory.activity).to.equal(blackjack);
            expect(inventory.game).to.equal(blackjack);
        });

        it("should handle unknown callback", function () {
            var blackjack = new CardTable('Blackjack'),
                inventory = new (CallbackHandler.extend({
                    $handle:[null, function (callback) {
                        callback.check = true;
                    }]
                }));
            expect(inventory.handle(blackjack)).to.be.true;
            expect(blackjack.check).to.be.true;
        });

        it("should handle unknown callback via delegate", function () {
            var blackjack = new CardTable('Blackjack'),
                inventory = new (Base.extend($callbacks, {
                    $handle:[null, function (callback) {
                        callback.check = true;
                    }]
                }));
                casino     = new Casino('Belagio').addHandlers(inventory);
            expect(casino.handle(blackjack)).to.be.true;
            expect(blackjack.check).to.be.true;
        });

        it("should allow handlers to chain to base", function () {
            var blackjack  = new CardTable('Blackjack'),
                Tagger     = CallbackHandler.extend({
                    $handle:[
                        Activity, function (activity) {
                            activity.tagged = true;
                        }]
                });
                inventory  = new (Tagger.extend({
                    $handle:[
                        Activity, function (activity) {
                            this.base();
                        }]
                }));
            expect(inventory.handle(blackjack)).to.be.true;
            expect(blackjack.tagged).to.be.true;
        });

        it("should handle callbacks with precedence rules", function () {
            var matched   = -1,
                Checkers  = Base.extend(Game),
                inventory = new (CallbackHandler.extend({
                    $handle:[
                        function (constraint) {
                            return constraint === PitBoss;
                        }, function (callback) {
                            matched = 0;
                        },
                        null,        function (callback) {
                            matched = 1;
                        },
                        Game,        function (callback) {
                            matched = 2;
                        },
                        Security,    function (callback) {
                            matched = 3;
                        },
                        Activity,    function (callback) {
                            matched = 5;
                        },
                        Accountable, function (callback) {
                            matched = 4;
                        },
                        CardTable,   function (callback) {
                            matched = 6;
                        }]
                }));
            inventory.handle(new CardTable('3 Card Poker'));
            expect(matched).to.equal(6);
            inventory.handle(new Activity('Video Poker'));
            expect(matched).to.equal(5);
            inventory.handle(new Cashier(100));
            expect(matched).to.equal(4);
            inventory.handle(new Level1Security);
            expect(matched).to.equal(3);
            inventory.handle(new Checkers);
            expect(matched).to.equal(2);
            inventory.handle(new Casino('Paris'));
            expect(matched).to.equal(1);
            inventory.handle(new PitBoss('Mike'));
            expect(matched).to.equal(0);
        });

        it("should handle callbacks greedy", function () {
            var cashier    = new Cashier(1000000.00),
                blackjack  = new Activity('Blackjack'),
                casino     = new Casino('Belagio')
                .addHandlers(cashier, blackjack),
            countMoney = new CountMoney;
            cashier.transfer(50000, blackjack)

            expect(blackjack.getBalance()).to.equal(50000);
            expect(cashier.getBalance()).to.equal(950000);
            expect(casino.handle(countMoney, true)).to.be.true;
            expect(countMoney.getTotal()).to.equal(1000000.00);
        });

        it("should handle callbacks anonymously", function () {
            var countMoney = new CountMoney,
                handler    = CallbackHandler.accepting(function (countMoney) {
                    countMoney.record(50);
                }, CountMoney);
            expect(handler.handle(countMoney)).to.be.true;
            expect(countMoney.getTotal()).to.equal(50);
        });

        it("should handle compound keys", function () {
            var cashier    = new Cashier(1000000.00),
                blackjack  = new Activity('Blackjack'),
                bank       = new (Accountable.extend()),
                inventory  = new (CallbackHandler.extend({
                    $handle:[
                        [Cashier, Activity], function (accountable) {
                            this.accountable = accountable;
                        }]
                }));
            expect(inventory.handle(cashier)).to.be.true;
            expect(inventory.accountable).to.equal(cashier);
            expect(inventory.handle(blackjack)).to.be.true;
            expect(inventory.accountable).to.equal(blackjack);
            expect(inventory.handle(bank)).to.be.false;
        });

        it("should unregister compound keys", function () {
            var cashier    = new Cashier(1000000.00),
                blackjack  = new Activity('Blackjack'),
                bank       = new (Accountable.extend()),
                inventory  = new CallbackHandler,
                unregister = $handle(inventory, [Cashier, Activity], function (accountable) {
                    this.accountable = accountable;
                });
            expect(inventory.handle(cashier)).to.be.true;
            expect(inventory.accountable).to.equal(cashier);
            expect(inventory.handle(blackjack)).to.be.true;
            expect(inventory.accountable).to.equal(blackjack);
            expect(inventory.handle(bank)).to.be.false;
            unregister();
            expect(inventory.handle(cashier)).to.be.false;
            expect(inventory.handle(blackjack)).to.be.false;
        });
    })

    describe("#defer", function () {
        it("should handle objects eventually", function (done) {
            var cashier    = new Cashier(750000.00),
                casino     = new Casino('Venetian').addHandlers(cashier),
                wireMoney  = new WireMoney(250000);
            Promise.resolve(casino.defer(wireMoney)).then(function (handled) {
                expect(handled).to.be.true;
                expect(wireMoney.received).to.equal(250000);
                done();
            });
        });

        it("should handle objects eventually with promise", function (done) {
            var bank       = (new (CallbackHandler.extend({
                    $handle:[
                        WireMoney, function (wireMoney) {
                            wireMoney.received = 50000;
                            return Promise.delay(wireMoney, 100);
                        }]
                }))),
                casino     = new Casino('Venetian').addHandlers(bank),
                wireMoney  = new WireMoney(150000);
            Promise.resolve(casino.defer(wireMoney)).then(function (handled) {
                expect(handled).to.be.true;
                expect(wireMoney.received).to.equal(50000);
                done();
            });
        });

        it("should handle callbacks anonymously with promise", function (done) {
            var handler    = CallbackHandler.accepting(function (countMoney) {
                    countMoney.record(50);
                }, CountMoney),
                countMoney = new CountMoney;
            Promise.resolve(handler.defer(countMoney)).then(function (handled) {
                expect(handled).to.be.true;
                expect(countMoney.getTotal()).to.equal(50);
                done();
            });
        });
    });

    describe("#resolve", function () {
        it("should resolve explicit objects", function () {
            var cashier    = new Cashier(1000000.00),
                inventory  = new (CallbackHandler.extend({
                    $provide:[Cashier, cashier]
                }));
            expect(inventory.resolve(Cashier)).to.equal(cashier);
        });

        it("should infer constraint from explicit objects", function () {
            var cashier    = new Cashier(1000000.00),
                inventory  = new CallbackHandler;
            $provide(inventory, cashier);
            expect(inventory.resolve(Cashier)).to.equal(cashier);
        });

        it("should resolve copy of object with $copy", function () {
            var Circle     = Base.extend({
                    constructor: function (radius) {
                        this.radius = radius;
                    },
                    copy: function () {
                        return new Circle(this.radius);
                    }
                }),
                circle     = new Circle(2),
                shapes     = new (CallbackHandler.extend({
                    $provide:[Circle, $copy(circle)]
                }));
           var shape = shapes.resolve(Circle);
           expect(shape).to.not.equal(circle);
           expect(shape.radius).to.equal(2);
        });

        it("should resolve objects by class implicitly", function () {
            var cashier    = new Cashier(1000000.00),
                casino     = new Casino('Belagio').addHandlers(cashier);
            expect(casino.resolve(Casino)).to.equal(casino);
            expect(casino.resolve(Cashier)).to.equal(cashier);
        });

        it("should resolve objects by protocol implicitly", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                casino     = new Casino('Belagio').addHandlers(blackjack);
            expect(casino.resolve(Game)).to.equal(blackjack);
        });

        it("should resolve objects by class explicitly", function () {
            var casino     = new Casino('Belagio'),
                pitBoss    = casino.resolve(PitBoss);
            expect(pitBoss).to.be.an.instanceOf(PitBoss);
        });

        it("should resolve objects by per instance", function () {
            var cashier    = new Cashier(1000000.00),
                provider   = new CallbackHandler;
            $provide(provider, Cashier, function (resolution) {
                return cashier;
            });
            expect(provider.resolve(Cashier)).to.equal(cashier);
        });

        it("should resolve objects by class invariantly", function () {
            var cashier    = new Cashier(1000000.00),
                inventory  = new (CallbackHandler.extend({
                    $provide:[
                        $eq(Cashier), function (resolution) {
                            return cashier;
                        }]
                }));
            expect(inventory.resolve(Accountable)).to.be.undefined;
            expect(inventory.resolve(Cashier)).to.equal(cashier);
            $provide(inventory, Cashier, function (resolution) {
                return cashier;
            });
            expect(inventory.resolve(Accountable)).to.equal(cashier);
        });

        it("should resolve objects by protocol invariantly", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $provide:[
                        $eq(Game), function (resolution) {
                            return blackjack;
                        }]
                }));
            expect(cardGames.resolve(CardTable)).to.be.undefined;
            expect(cardGames.resolve(Game)).to.equal(blackjack);
        });

        it("should resolve objects by class instantly", function () {
            var cashier    = new Cashier(1000000.00),
                blackjack  = new CardTable("BlackJack", 1, 5),
                inventory  = new (CallbackHandler.extend({
                    $provide:[
                        Cashier, function (resolution) {
                            return cashier;
                        },
                        CardTable, function (resolution) {
                            return Promise.resolve(blackjack);
                        }]
                }));
            expect(inventory.resolve($instant(Cashier))).to.equal(cashier);
            expect($isPromise(inventory.resolve(CardTable))).to.be.true;
            expect(inventory.resolve($instant(CardTable))).to.be.undefined;
        });

        it("should resolve objects by protocol instantly", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $provide:[
                        Game, function (resolution) {
                            return Promise.resolve(blackjack);
                        }]
                }));
            expect($isPromise(cardGames.resolve(Game))).to.be.true;
            expect(cardGames.resolve($instant(Game))).to.be.undefined;
        });

        it("should resolve by string literal", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $provide:[
                        'BlackJack', function (resolution) {
                            return blackjack;
                        }]
                }));
            expect(cardGames.resolve('BlackJack')).to.equal(blackjack);
        });

        it("should resolve by string instance", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $provide:[
                        'BlackJack', function (resolution) {
                            return blackjack;
                        }]
                }));
            expect(cardGames.resolve(new String("BlackJack"))).to.equal(blackjack);
        });

        it("should resolve string by regular expression", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $provide:[
                        /black/i, function (resolution) {
                            return blackjack;
                        }]
                }));
            expect(cardGames.resolve('BlackJack')).to.equal(blackjack);
        });

        it("should resolve instances using instance class", function () {
            var Config  = Base.extend({
                    constructor: function (key) {
                        this.extend({
                                getKey: function () { return key; }
                            });
                    }
                });
                settings  = new (CallbackHandler.extend({
                    $provide:[
                        Config, function (resolution) {
                            var config = resolution.getKey(),
                                key    = config.getKey();
                            if (key == "url") {
                                return "my.server.com";
                            } else if (key == "user") {
                                return "dba";
                            }
                        }]
                }));
                expect(settings.resolve(new Config("user"))).to.equal("dba");
                expect(settings.resolve(new Config("name"))).to.be.undefined;
        });

        it("should resolve objects with compound keys", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cashier    = new Cashier(1000000.00),
                cardGames  = new (CallbackHandler.extend({
                    $provide:[
                        [CardTable, Cashier], function (resolution) {
                            var key = resolution.getKey();
                            if (key.conformsTo(Game)) {
                                return blackjack;
                            } else if (key === Cashier) {
                                return cashier;
                            }
                        }]
                }));
            expect(cardGames.resolve(Game)).to.equal(blackjack);
            expect(cardGames.resolve(Cashier)).to.equal(cashier);
        });

        it("should unregister objects with compound keys", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cashier    = new Cashier(1000000.00),
                cardGames  = new CallbackHandler,
                unregister = $provide(cardGames, [CardTable, Cashier], function (resolution) {
                    var key = resolution.getKey();
                    if (key.conformsTo(Game)) {
                        return blackjack;
                    } else if (key === Cashier) {
                        return cashier;
               }});
            expect(cardGames.resolve(Game)).to.equal(blackjack);
            expect(cardGames.resolve(Cashier)).to.equal(cashier);
            unregister();
            expect(cardGames.resolve(Game)).to.be.undefined;
            expect(cardGames.resolve(Cashier)).to.be.undefined;
        });

        it("should not resolve objects if not found", function () {
            var something = new CallbackHandler;
            expect(something.resolve(Cashier)).to.be.undefined;
        });

        it("should not resolve objects if $NOT_HANDLED", function () {
            var inventory  = new (CallbackHandler.extend({
                    $provide:[
                        Cashier, function (resolution) {
                            return $NOT_HANDLED;
                        }]
                }));
            expect(inventory.resolve(Cashier)).to.be.undefined;
        });

        it("should resolve unknown objects", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $provide:[
                        True, function (resolution) {
                            if (resolution.getKey() === CardTable) {
                                return blackjack;
                            }
                        }]
                }));
            expect(cardGames.resolve(CardTable)).to.equal(blackjack);
            expect(cardGames.resolve(Game)).to.be.undefined;
        });

        it("should resolve objects by class eventually", function (done) {
            var casino = new Casino('Venetian');
            Promise.resolve(casino.resolve(DrinkServer)).then(function (server) {
                expect(server).to.be.an.instanceOf(DrinkServer);
                done();
            });
        });

        it("should not resolve by string", function () {
            var casino = new Casino('Venetian');
            expect(casino.resolve("slot machine")).to.be.undefined;
        });

        it("should resolve with precedence rules", function () {
            var Checkers  = Base.extend(Game),
                inventory = new (CallbackHandler.extend({
                    $provide:[
                        function (constraint) {
                            return constraint === PitBoss;
                        }, function (callback) {
                            return 0;
                            },
                        null, function (callback) {
                            return 1;
                        },
                        Checkers, function (callback) {
                            return 2;
                        },
                        Level1Security, function (callback) {
                            return 3;
                        },
                        Activity, function (callback) {
                            return 5;
                        },
                        Accountable, function (callback) {
                            return 4;
                        },
                        CardTable, function (callback) {
                            return 6;
                            }]
                }));
                      expect(inventory.resolve(CardTable)).to.equal(6);
            expect(inventory.resolve(Activity)).to.equal(5);
            expect(inventory.resolve(Cashier)).to.equal(1);
            expect(inventory.resolve(Security)).to.equal(3);
            expect(inventory.resolve(Game)).to.equal(2);
            expect(inventory.resolve(Casino)).to.equal(1);
            expect(inventory.resolve(PitBoss)).to.equal(0);
        });
    });

    describe("#resolveAll", function () {
        it("should resolve all objects by class explicitly", function (done) {
            var belagio    = new Casino('Belagio'),
                venetian   = new Casino('Venetian'),
                paris      = new Casino('Paris'),
                strip      = belagio.next(venetian, paris);
            Promise.resolve(strip.resolveAll(Casino)).then(function (casinos) {
                expect(casinos).to.eql([belagio, venetian, paris]);
                done();
            });
        });

        it("should resolve all objects by class eventually", function (done) {
            var stop1      = [ new PitBoss("Craig"),  new PitBoss("Matthew") ],
                stop2      = [ new PitBoss("Brenda"), new PitBoss("Lauren"), new PitBoss("Kaitlyn") ],
                stop3      = [ new PitBoss("Phil") ],
                bus1       = new (CallbackHandler.extend({
                    $provide:[ PitBoss, function (resolution) {
                        expect(resolution.isMany()).to.be.true;
                        return Promise.delay(stop1, 75);
                    }]
                })),
                bus2       = new (CallbackHandler.extend({
                    $provide:[ PitBoss, function (resolution) {
                        expect(resolution.isMany()).to.be.true;
                        return Promise.delay(stop2, 100);
                    }]
                })),
                bus3       = new (CallbackHandler.extend({
                    $provide:[ PitBoss, function (resolution) {
                        expect(resolution.isMany()).to.be.true;
                        return Promise.delay(stop3, 50);
                    }]
                })),
                company    = bus1.next(bus2, bus3);
            Promise.resolve(company.resolveAll(PitBoss)).then(function (pitBosses) {
                expect(pitBosses).to.eql(js.Array2.flatten([stop1, stop2, stop3]));
                done();
            });
        });

        it("should resolve all objects by class instantly", function () {
            var belagio    = new Casino('Belagio'),
                venetian   = new Casino('Venetian'),
                paris      = new Casino('Paris'),
                strip      = new (CallbackHandler.extend({
                    $provide:[
                        Casino, function (resolution) {
                            return venetian;
                        },
                        Casino, function (resolution) {
                            return Promise.resolve(belagio);
                        },
                        Casino, function (resolution) {
                            return paris;
                        }]
                }));
            var casinos = strip.resolveAll($instant(Casino));
            expect(casinos).to.eql([venetian, paris]);
        });

        it("should return empty array if none resolved", function (done) {
            Promise.resolve((new CallbackHandler).resolveAll(Casino)).then(function (casinos) {
                expect(casinos).to.have.length(0);
                done();
            });
        });

        it("should return empty array instantly if none resolved", function () {
            var belagio  = new Casino('Belagio'),
                strip    = new (CallbackHandler.extend({
                    $provide:[
                        Casino, function (resolution) {
                            return Promise.resolve(belagio);
                        }]
                }));
            var casinos = strip.resolveAll($instant(Casino));
            expect(casinos).to.have.length(0);
        });
    });

    describe("#lookup", function () {
        it("should lookup by class", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $lookup:[
                        CardTable, function (lookup) {
                            return blackjack;
                        },
                        null, function (lookup) {
                            return blackjack;
                        }]
                }));
            expect(cardGames.lookup(CardTable)).to.equal(blackjack);
            expect(cardGames.lookup(Game)).to.be.undefined;
        });

        it("should lookup by protocol", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $lookup:[
                        Game, function (lookup) {
                            return blackjack;
                        },
                        null, function (lookup) {
                            return blackjack;
                        }]
                }));
            expect(cardGames.lookup(Game)).to.equal(blackjack);
            expect(cardGames.lookup(CardTable)).to.be.undefined;
        });

        it("should lookup by string", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = new (CallbackHandler.extend({
                    $lookup:[
                        'blackjack', function (lookup) {
                            return blackjack;
                        },
                        /game/, function (lookup) {
                            return blackjack;
                        }]
                }));
            expect(cardGames.lookup('blackjack')).to.equal(blackjack);
            expect(cardGames.lookup('game')).to.be.undefined;
        });
    });

    describe("#filter", function () {
        it("should accept callback", function () {
            var cashier    = new Cashier(1000000.00),
                casino     = new Casino('Belagio').addHandlers(cashier),
                countMoney = new CountMoney;
            expect(casino.filter(function (cb, cm, proceed) { return proceed(); })
                   .handle(countMoney)).to.be.true;
            expect(countMoney.getTotal()).to.equal(1000000.00);
        });

        it("should reject callback", function () {
            var cashier    = new Cashier(1000000.00),
                casino     = new Casino('Belagio').addHandlers(cashier),
                countMoney = new CountMoney;
            expect(casino.filter(False).handle(countMoney)).to.be.false;
        });

        it("should ignore filter when reentrant", function () {
            var cashier      = new Cashier(1000000.00),
                casino       = new Casino('Belagio').addHandlers(cashier),
                countMoney   = new CountMoney,
                filterCalled = 0;
            expect(casino.filter(function (cb, cm, proceed) {
                ++filterCalled;
                expect(cm.resolve(Cashier)).to.equal(cashier);
                return proceed();
            }).handle(countMoney)).to.be.true;
            expect(filterCalled).to.equal(1);
        });
    });

    describe("#aspect", function () {
        it("should ignore callback", function () {
            var cashier    = new Cashier(1000000.00),
                casino     = new Casino('Belagio').addHandlers(cashier),
                countMoney = new CountMoney;
            expect(casino.aspect(False).handle(countMoney)).to.be.true;
            expect(countMoney.getTotal()).to.equal(0);
        });

        it("should ignore invocation", function () {
            var guest = new Guest(21),
                level = CallbackHandler(new Level1Security);
            expect(Security(level.aspect(False)).admit(guest)).to.be.undefined;
        });

        it("should handle callback with side-effect", function () {
            var cashier    = new Cashier(1000000.00),
                casino     = new Casino('Belagio').addHandlers(cashier),
                countMoney = new CountMoney;
            expect(casino.aspect(True, function (countIt) { countIt.record(-1); })
                   .handle(countMoney)).to.be.true;
            expect(countMoney.getTotal()).to.equal(999999.00);
        });

        it("should invoke with side-effect", function () {
            var count = 0,
                guest = new Guest(21),
                level = CallbackHandler(new Level1Security);
            expect(Security(level.aspect(True, function () { ++count; }))
                            .admit(guest)).to.be.true;
            expect(count).to.equal(1);
        });

        it("should ignore deferrerd callback", function (done) {
            var cashier    = new Cashier(750000.00),
                casino     = new Casino('Venetian').addHandlers(cashier),
                wireMoney  = new WireMoney(250000);
            Promise.resolve(casino.aspect(function () {
                return Promise.resolve(false);
            }).defer(wireMoney)).then(function (handled) {
                throw new Error("Should not get here");
            }, function (error) {
                expect(error).to.be.instanceOf(RejectedError);
                done();
            });
        });

        it("should ignore async invocation", function (done) {
            var level2 = CallbackHandler(new Level2Security);
            Security(level2.aspect(function () {
                return Promise.resolve(false);
            })).scan().then(function (scanned) {
                throw new Error("Should not get here");
            }, function (error) {
                expect(error).to.be.instanceOf(RejectedError);
                done();
            });
        });

        it("should handle deferred callback with side-effect", function (done) {
            var cashier    = new Cashier(750000.00),
                casino     = new Casino('Venetian').addHandlers(cashier),
                wireMoney  = new WireMoney(250000);
            Promise.resolve(casino.aspect(True, function (wire) {
                received = wire.received;
                done();
            }).defer(wireMoney)).then(function (handled) {
                expect(handled).to.be.true;
                expect(wireMoney.received).to.equal(250000);
            });
        });

        it("should invoke async with side-effect", function (done) {
            var level2 = CallbackHandler(new Level2Security);
            Security(level2.aspect(True, function () {
                done();
            })).scan().then(function (scanned) {
                expect(scanned).to.be.true;
            });
        });

        it("should fail on exception in before", function () {
            var cashier    = new Cashier(1000000.00),
                casino     = new Casino('Belagio').addHandlers(cashier),
                countMoney = new CountMoney;
            expect(function () {
                expect(casino.aspect(function () { throw new Error; })
                       .handle(countMoney)).to.be.false;
            }).to.throw(Error);
        });

        it("should fail callback on rejection in before", function (done) {
            var cashier    = new Cashier(1000000.00),
                casino     = new Casino('Belagio').addHandlers(cashier),
                countMoney = new CountMoney;
            casino.aspect(function () {
                setTimeout(done, 2);
                return Promise.reject(new Error("Something bad"));
            }).defer(countMoney).catch(function (error) {
                expect(error).to.be.instanceOf(Error);
                expect(error.message).to.equal("Something bad");
            });
        });

        it("should fail async invoke on rejection in before", function (done) {
            var level2 = CallbackHandler(new Level2Security);
            Security(level2.aspect(function () {
                setTimeout(done, 2);
                return Promise.reject(new Error("Something bad"));
            })).scan().catch(function (error) {
                expect(error).to.be.instanceOf(Error);
                expect(error.message).to.equal("Something bad");
            });
        });
    });
    
    describe("#next", function () {
        it("should cascade handlers using short syntax", function () {
            var guest    = new Guest(17),
                baccarat = new Activity('Baccarat'),
                level1   = new Level1Security,
                level2   = new Level2Security,
                security = CallbackHandler(level1).next(level2);
            expect(Security(security).admit(guest)).to.be.false;
            Security(security).trackActivity(baccarat);
        });

        it("should compose handlers using short syntax", function () {
            var baccarat = new Activity('Baccarat'),
                level1   = new Level1Security,
                level2   = new Level2Security,
                compose  = CallbackHandler(level1).next(level2, baccarat),
            countMoney = new CountMoney();
            expect(compose.handle(countMoney)).to.be.true;
        });
    });

    describe("#when", function () {
        it("should restrict handlers using short syntax", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = (new (CallbackHandler.extend({
                    $handle:[
                        True, function (cardTable) {
                            cardTable.closed = true;
                        }]
                }))).when(CardTable);
            expect(cardGames.handle(blackjack)).to.be.true;
            expect(blackjack.closed).to.be.true;
            expect(cardGames.handle(new Cashier)).to.be.false;
        });

        it("should restrict handlers invariantly using short syntax", function () {
            var Blackjack  = CardTable.extend({
                    constructor: function () {
                        this.base("BlackJack", 1, 5);
                    }
                }),
                blackjack  = new Blackjack,
                cardGames  = (new (CallbackHandler.extend({
                    $handle:[
                        True, function (cardTable) {
                            cardTable.closed = true;
                        }]
                }))).when($eq(CardTable));
            expect(cardGames.handle(blackjack)).to.be.false;
            expect(blackjack.closed).to.be.undefined;
            expect(cardGames.handle(new Cashier)).to.be.false;
        });

        it("should restrict providers using short syntax", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = (new (CallbackHandler.extend({
                    $provide:[
                        True, function (resolution) {
                            return blackjack;
                        }]
                }))).when(CardTable);
            expect(cardGames.resolve(CardTable)).to.equal(blackjack);
            expect(cardGames.resolve(Cashier)).to.be.undefined;
        });

        it("should restrict providers invariantly using short syntax", function () {
            var blackjack  = new CardTable("BlackJack", 1, 5),
                cardGames  = (new (CallbackHandler.extend({
                    $provide:[
                        True, function (resolution) {
                            return blackjack;
                        }]
                }))).when($eq(Activity));
            expect(cardGames.resolve(Activity)).to.equal(blackjack);
            expect(cardGames.resolve(CardTable)).to.be.undefined;
            expect(cardGames.resolve(Cashier)).to.be.undefined;
        });
    });

    describe("#implementing", function () {
        var Calculator = Protocol.extend({
            add:    function (op1, op2) {},
            divide: function (dividend, divisor) {},
            clear:  function () {}
        });
        
        it("should call function", function () {
            var add = CallbackHandler.implementing("add", function (op1, op2) {
                return op1 + op2;
            });
            expect(Calculator(add).add(5, 10)).to.equal(15);
        });

        it("should propgate exception in function", function () {
            var divide = CallbackHandler.implementing("divide", function (dividend, divisor) {
                if (divisor === 0)
                    throw new Error("Division by zero");
                return dividend / divisor;
            });
            expect(function () {
                Calculator(divide).divide(10,0);
            }).to.throw(Error, /Division by zero/);
        });

        it("should bind function", function () {
            var context = new Object,
                clear   = CallbackHandler.implementing("clear", (function () {
                return context;
            }).bind(context));
            expect(Calculator(clear).clear()).to.equal(context);
        });

        it("should require non-empty method name", function () {
            expect(function () {
                CallbackHandler.implementing(null, function () {});
            }).to.throw(Error, /No methodName specified/);

            expect(function () {
                 CallbackHandler.implementing(void 0, function () {});
            }).to.throw(Error, /No methodName specified/);

            expect(function () {
                CallbackHandler.implementing(10, function () {});
            }).to.throw(Error, /No methodName specified/);

            expect(function () {
                CallbackHandler.implementing("", function () {});
            }).to.throw(Error, /No methodName specified/);

            expect(function () {
                CallbackHandler.implementing("   ", function () {});
            }).to.throw(Error, /No methodName specified/);
        });
    });
});

describe("CascadeCallbackHandler", function () {
    describe("#handle", function () {
        it("should cascade handlers", function () {
            var guest    = new Guest(17),
                baccarat = new Activity('Baccarat'),
                level1   = new Level1Security,
                level2   = new Level2Security,
                security = new CascadeCallbackHandler(level1, level2);
            expect(Security(security).admit(guest)).to.be.false;
            Security(security).trackActivity(baccarat);
        });
    });
});

describe("InvocationCallbackHandler", function () {
    describe("#handle", function () {
        it("should handle invocations", function () {
            var guest1 = new Guest(17),
                guest2 = new Guest(21),
                level1 = CallbackHandler(new Level1Security);
            expect(Security(level1).admit(guest1)).to.be.false;
            expect(Security(level1).admit(guest2)).to.be.true;
        });
        
        it("should handle async invocations", function (done) {
            var level2 = CallbackHandler(new Level2Security);
            Security(level2).scan().then(function () {
                done();
            });
        });

        it("should ignore explicitly unhandled invocations", function () {
            var texasHoldEm = new CardTable("Texas Hold'em", 2, 7),
            casino    = new Casino('Caesars Palace')
                .addHandlers(texasHoldEm);
            expect(function () {
                Game(casino).open(5);
            }).to.not.throw(Error);
            expect(function () {
                Game(casino).open(9);
            }).to.throw(Error, /has no method 'open'/);
        });

        it("should fail missing methods", function () {
            var letItRide = new Activity('Let It Ride'),
                level1    = new Level1Security,
                casino    = new Casino('Treasure Island')
                .addHandlers(level1, letItRide);

            expect(function () {
                Security(casino).trackActivity(letItRide)
            }).to.throw(Error, /has no method 'trackActivity'/);
        });

        it("should ignore missing methods", function () {
            var letItRide = new Activity('Let It Ride'),
                level1    = new Level1Security,
                casino    = new Casino('Treasure Island')
                .addHandlers(level1, letItRide);
            expect(Security(casino.$bestEffort()).trackActivity(letItRide)).to.be.undefined;
        });

        it("should require protocol conformance", function () {
            var gate  = new (CallbackHandler.extend(Security, {
                    admit: function (guest) { return true; }
                }));
            expect(Security(gate.$strict()).admit(new Guest('Me'))).to.be.true;
        });

        it("should reject if no protocol conformance", function () {
            var gate  = new (CallbackHandler.extend({
                    admit: function (guest) { return true; }
                }));
            expect(function () {
                Security(gate.$strict()).admit(new Guest('Me'))
            }).to.throw(Error, /has no method 'admit'/);
        });

        it("should broadcast invocations", function () {
            var letItRide = new Activity('Let It Ride'),
                level1    = new Level1Security,
                level2    = new Level2Security,
                casino    = new Casino('Treasure Island')
                .addHandlers(level1, level2, letItRide);
            Security(casino.$broadcast()).trackActivity(letItRide);
        });

        it("should notify invocations", function () {
            var letItRide = new Activity('Let It Ride'),
                level1    = new Level1Security,
                casino    = new Casino('Treasure Island')
                .addHandlers(level1, letItRide);
            Security(casino.$notify()).trackActivity(letItRide);
        });

        it("should notify invocations", function () {
            var letItRide = new Activity('Let It Ride'),
                level1    = new Level1Security,
                casino    = new Casino('Treasure Island')
                .addHandlers(level1, letItRide);
            Security(casino.$notify()).trackActivity(letItRide);
        });

        it("should resolve target for invocation", function () {
            var Poker = Base.extend(Game, {
                    open: function (numPlayers) {
                        return "poker" + numPlayers;
                    }
                }),
                handler = new CallbackHandler(new Poker),
                id      = Game(handler.$resolve()).open(5);
            expect(id).to.equal("poker5");
        });

        it("should resolve target for invocation using promise", function (done) {
            var Poker = Base.extend(Game, {
                    open: function (numPlayers) {
                        return "poker" + numPlayers;
                    }
                }),
                handler = new (CallbackHandler.extend({
                    $provide: [
                        Game, function () {
                            return Promise.delay(new Poker, 10);
                        }]
                }));
            Game(handler.$resolve()).open(5).then(function (id) {
                expect(id).to.equal("poker5");
                done();
            });
        });
        
        it("should fail invocation if unable to resolve", function () {
            var handler = new CallbackHandler;
            expect(function () {
                Game(handler.$resolve()).open(4);
            }).to.throw(TypeError, /has no method 'open'/);
        });

        it("should fail invocation if method not found", function () {
            var Poker   = Base.extend(Game),
                handler = new CallbackHandler(new Poker);
            expect(function () {
                Game(handler.$resolve()).open(4);
            }).to.throw(TypeError, /has no method 'open'/);
        });

        it("should fail invocation promise if method not found", function (done) {
            var Poker   = Base.extend(Game),
                handler = new (CallbackHandler.extend({
                    $provide: [
                        Game, function () {
                            return Promise.delay(new Poker, 10);
                        }]
                }));
            Game(handler.$resolve()).open(5).catch(function (error) {
                expect(error).to.be.instanceOf(TypeError);
                expect(error.message).to.match(/has no method 'open'/)
                done();
            });            
        });

        it("should ignore invocation if unable to resolve", function () {
            var handler = new CallbackHandler,
                id      = Game(handler.$resolve().$bestEffort()).open(4);
            expect(id).to.be.undefined;
        });

        it("should ignore invocation if unable to resolve promise", function (done) {
            var handler = new (CallbackHandler.extend({
                    $provide: [
                        Game, function () {
                            return Promise.delay($NOT_HANDLED, 10);
                        }]
            }));
            Game(handler.$resolve().$bestEffort()).open(5).then(function (id) {
                expect(id).to.be.undefiend;
                done();
            });            
        });
        
        it("should resolve all targets or invocation", function () {
            var count = 0,
                Poker = Base.extend(Game, {
                    open: function (numPlayers) {
                        ++count;
                        return "poker" + numPlayers;
                    }
                }),
                Slots = Base.extend(Game, {
                    open: function (numPlayers) {
                        ++count;
                        return "poker" + numPlayers;
                    }
                }),                
                handler = new CascadeCallbackHandler(new Poker, new Slots),
                id      = Game(handler.$resolve().$broadcast()).open(5);
            expect(id).to.equal("poker5");
            expect(count).to.equal(2);
        });

        it("should resolve all targets or invocation using promise", function (done) {
            var count = 0,
                Poker = Base.extend(Game, {
                    open: function (numPlayers) {
                        ++count;
                        return "poker" + numPlayers;
                    }
                }),
                Slots = Base.extend(Game, {
                    open: function (numPlayers) {
                        ++count;
                        return "poker" + numPlayers;
                    }
                }),                
                handler = new CascadeCallbackHandler(
                    new (CallbackHandler.extend({
                        $provide: [
                            Game, function () {
                                return Promise.delay(new Poker, 10);
                            }]
                    })),
                    new (CallbackHandler.extend({
                        $provide: [
                            Game, function () {
                                return Promise.delay(new Slots, 5);
                            }]
                    }))
                );
            Game(handler.$resolve().$broadcast()).open(5).then(function (id) {
                expect(id).to.equal("poker5");
                expect(count).to.equal(2);                
                done();
            });
        });
        
        it("should fail invocation if unable to resolve all", function () {
            var handler = new CallbackHandler;
            expect(function () {
                Game(handler.$resolve().$broadcast()).open(4);
            }).to.throw(Error, /has no method 'open'/);
        });

        it("should apply filters to resolved invocations", function () {
            var Poker = Base.extend(Game, {
                    open: function (numPlayers) {
                        return "poker" + numPlayers;
                    }
                }),
                handler = new CallbackHandler(new Poker);
            expect(Game(handler.$resolve().filter(
                function (cb, cm, proceed) { return proceed(); })).open(5))
                .to.equal("poker5");
            expect(function () {
                Game(handler.$resolve().filter(False)).open(5);
            }).to.throw(Error, /has no method 'open'/);
        });
    })
});
