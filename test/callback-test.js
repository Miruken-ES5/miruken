var miruken  = require('../lib/miruken.js'),
    callback = require('../lib/callback.js'),
    Q        = require('q'),
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
        constructor: function (age) {
            this.extend({
                getAge: function () { return age; }
            });
        }
    });

    var Dealer = Base.extend({
        constructor: function () {
            this.extend({
                shuffle: function (cards) {
                    return cards.sort(function () {
                        return 0.5 - Math.random();
                    });
                }
            });
        }
    });

    var PitBoss = Base.extend({
        constructor: function (name) {
            this.extend({
                getName: function () { return name; }
            });
        }
    });

    var DrinkServer = Base.extend({
    });

    var Game = Protocol.extend({
        open: function (numPlayers) {}
    });

    var Security = Protocol.extend({
        admit: function (guest) {},
        trackActivity: function (activity) {}
    });

    var Level1Security = Base.extend(Security, {
        admit: function (guest) {
            return guest.getAge() >= 21;
        }
    });

    var Level2Security = Base.extend(Security, {
        trackActivity: function (activity) {
            console.log(lang.format("Tracking '%1'", activity.getName()));
        }
    });

    var WireMoney = Base.extend({
        constructor: function (requested) {
            var _received = 0.0;
            this.extend({
                getRequested: function () { return requested; },
                getReceived:  function () { return _received;},
                setReceived:  function (received) { _received = received; }
            });
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

    var Accountable = Expandable.extend({
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
                    return Q.delay(100);
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
                wireMoney.setReceived(wireMoney.getRequested());
                return Q(wireMoney);
            }]
    });

    var Activity = Accountable.extend({
        constructor: function (name) {
            this.base();
            this.extend({
                getName: function () { return name; },
            });
        },
        toString: function () { return 'Activity ' + this.getName(); }
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
        constructor: function (name) {
            this.base();
            this.extend({
                getName: function () { return name; }
            });
        },
        toString: function () { return 'Casino ' + this.getName(); },

        $provide:[
            PitBoss, function (composer) {
                return new PitBoss('Freddy');
            },

            DrinkServer, function (composer) {
                return Q.delay(new DrinkServer(), 100);
            }]
    });

  eval(this.exports);
};

eval(base2.callback_test.namespace);

describe("HandleMethod", function () {
    describe("#getMethodName", function () {
        it("should get the method name", function () {
            var method = new HandleMethod(undefined, "deal", [[1,3,8], 2]);
            expect(method.getMethodName()).to.equal("deal");
        });
    });

    describe("#getArguments", function () {
        it("should get the method arguments", function () {
            var method = new HandleMethod(undefined, "deal", [[1,3,8], 2]);
            expect(method.getArguments()).to.eql([[1,3,8], 2]);
        });

        it("should be able to change arguments", function () {
            var method = new HandleMethod(undefined, "deal", [[1,3,8], 2]);
            method.getArguments()[0] = [2,4,8];
            expect(method.getArguments()).to.eql([[2,4,8], 2]);
        });
    });

    describe("#getReturnValue", function () {
        it("should get the return value", function () {
            var method = new HandleMethod(undefined, "deal", [[1,3,8], 2]);
            method.setReturnValue([1,8]);
            expect(method.getReturnValue()).to.eql([1,8]);
        });
    });

    describe("#setReturnValue", function () {
        it("should set the return value", function () {
            var method = new HandleMethod(undefined, "deal", [[1,3,8], 2]);
            method.setReturnValue([1,8]);
            expect(method.getReturnValue()).to.eql([1,8]);
        });
    });

    describe("#invokeOn", function () {
        it("should invoke method on target", function () {
            var dealer  = new Dealer(),
            method  = new HandleMethod(undefined, "shuffle", [[22,19,9,14,29]]),
            handled = method.invokeOn(dealer);
            expect(handled).to.be.true;
            expect(method.getReturnValue()).to.have.members([22,19,9,14,29]);
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
        it("should not have $miruken storage by default", function () {
            var handler    = new CallbackHandler;
            expect(handler.hasOwnProperty('$miruken')).to.be.false;
        });

        it("should create $miruken.$handle key when first handler registered", function () {
            var handler    = new CallbackHandler;
            $handle(handler, True, True);
            expect(handler.hasOwnProperty('$miruken')).to.be.true;
            expect(handler.$miruken.$handle).to.be.ok;
        });

        it("should maintain linked-list of handlers", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {};
            $handle(handler, Activity, nothing);
            $handle(handler, Accountable, nothing);
            $handle(handler, Game, nothing);
            expect(handler.$miruken.$handle.head.constraint).to.equal(Activity);
            expect(handler.$miruken.$handle.head.next.constraint).to.equal(Accountable);
            expect(handler.$miruken.$handle.tail.prev.constraint).to.equal(Accountable);
            expect(handler.$miruken.$handle.tail.constraint).to.equal(Game);
        });

        it("should order $handle contravariantly", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {};
            $handle(handler, Accountable, nothing);
            $handle(handler, Activity, nothing);
            expect(handler.$miruken.$handle.head.constraint).to.equal(Activity);
            expect(handler.$miruken.$handle.tail.constraint).to.equal(Accountable);
        });

        it("should order $handle invariantly", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                something   = function (callback) {};
            $handle(handler, Activity, nothing);
            $handle(handler, Activity, something);
            expect(handler.$miruken.$handle.head.handler).to.equal(nothing);
            expect(handler.$miruken.$handle.tail.handler).to.equal(something);
        });

        it("should order $provide covariantly", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {};
            $provide(handler, Activity, nothing);
            $provide(handler, Accountable, nothing);
            expect(handler.$miruken.$provide.head.constraint).to.equal(Accountable);
            expect(handler.$miruken.$provide.tail.constraint).to.equal(Activity);
        });

        it("should order $provide invariantly", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                something   = function (callback) {};
            $provide(handler, Activity, nothing);
            $provide(handler, Activity, something);
            expect(handler.$miruken.$provide.head.handler).to.equal(nothing);
            expect(handler.$miruken.$provide.tail.handler).to.equal(something);
        });

        it("should order $lookup invariantly", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                something   = function (callback) {};
            $lookup(handler, Activity, nothing);
            $lookup(handler, Activity, something);
            expect(handler.$miruken.$lookup.head.handler).to.equal(nothing);
            expect(handler.$miruken.$lookup.tail.handler).to.equal(something);
        });

        it("should index first registered handler with head and tail", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                unregister  = $handle(handler, True, nothing);
            expect(unregister).to.be.a('function');
            expect(handler.$miruken.$handle.head.handler).to.equal(nothing);
            expect(handler.$miruken.$handle.tail.handler).to.equal(nothing);
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
            expect(handler.$miruken.$handle).to.be.undefined;
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
            expect(handler.$miruken.$handle).to.be.undefined;
        });

        it("should remove $handle when no handlers remain", function () {
            var handler     = new CallbackHandler,
                func        = function (callback) {},
                unregister  = $handle(handler, True, func);
            unregister();
            expect(handler.$miruken.$handle).to.be.undefined;
        });
    });

    describe("#index", function () {
        it("should index class constraints using assignID", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                index       = assignID(Activity);
            $handle(handler, Activity, nothing);
            expect(handler.$miruken.$handle.getIndex(index).constraint).to.equal(Activity);
        });

        it("should index protocol constraints using assignID", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                index       = assignID(Game);
            $handle(handler, Game, nothing);
            expect(handler.$miruken.$handle.getIndex(index).constraint).to.equal(Game);
        });

        it("should index string constraints using string", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {};
            $handle(handler, "something", nothing);
            expect(handler.$miruken.$handle.getIndex("something").handler).to.equal(nothing);
        });

        it("should move index to next match", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                something   = function (callback) {},
                index       = assignID(Activity),
                unregister  = $handle(handler, Activity, nothing);
            $handle(handler, Activity, something);
            expect(handler.$miruken.$handle.getIndex(index).handler).to.equal(nothing);
            unregister();
            expect(handler.$miruken.$handle.getIndex(index).handler).to.equal(something);
        });

        it("should remove index when no more matches", function () {
            var handler     = new CallbackHandler,
                nothing     = function (callback) {},
                index       = assignID(Activity);
            $handle(handler, Accountable, nothing);
            var unregister  = $handle(handler, Activity, nothing);
            unregister();
            expect(handler.$miruken.$handle.getIndex(index)).to.be.undefined;
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
            expect(handler.$miruken.$handle).to.be.undefined;
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
            expect(handler.$miruken.$provide).to.be.undefined;
        });
    });
});

describe("CallbackHandler", function () {
    describe("#handle", function () {
        it("should not handle nothing", function () {
            var casino     = new Casino();
            expect(casino.handle()).to.be.false;
            expect(casino.handle(null)).to.be.false;
        });

        it("should not handle anonymous objects", function () {
            var casino     = new Casino();
            expect(casino.handle({name:'Joe'})).to.be.false;
        });

        it("should handle callbacks", function () {
            var cashier    = new Cashier(1000000.00),
                casino     = new Casino('Belagio').addHandlers(cashier),
                countMoney = new CountMoney();
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
                inventory = new (Expandable.extend({
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
            countMoney = new CountMoney();
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
    })

    describe("#defer", function () {
        it("should handle objects eventually", function (done) {
            var cashier    = new Cashier(750000.00),
                casino     = new Casino('Venetian').addHandlers(cashier),
                wireMoney  = new WireMoney(250000);
            Q.when(casino.defer(wireMoney), function (handled) {
                expect(handled).to.be.true;
                expect(wireMoney.getReceived()).to.equal(250000);
                done();
            }, function (error) { done(error); });
        });

        it("should handle objects eventually with promise", function (done) {
            var bank       = (new (CallbackHandler.extend({
                    $handle:[
                        WireMoney, function (wireMoney) {
                            wireMoney.setReceived(50000);
                            return Q.delay(wireMoney, 100);
                        }]
                }))),
                casino     = new Casino('Venetian').addHandlers(bank),
                wireMoney  = new WireMoney(150000);
            Q.when(casino.defer(wireMoney), function (handled) {
                expect(handled).to.be.true;
                expect(wireMoney.getReceived()).to.equal(50000);
                done();
            }, function (error) { done(error); });
        });

        it("should handle callbacks anonymously with promise", function (done) {
            var handler    = CallbackHandler.accepting(function (countMoney) {
                    countMoney.record(50);
                }, CountMoney),
                countMoney = new CountMoney;
            Q.when(handler.defer(countMoney), function (handled) {
                expect(handled).to.be.true;
                expect(countMoney.getTotal()).to.equal(50);
                done();
            }, function (error) { done(error); });
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
            Q.when(casino.resolve(DrinkServer), function (server) {
                expect(server).to.be.an.instanceOf(DrinkServer);
                done();
            }, function (error) { done(error); });
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
            Q.when(strip.resolveAll(Casino), function (casinos) {
                expect(casinos).to.eql([belagio, venetian, paris]);
                done();
            }, function (error) { done(error); });
        });

        it("should resolve all objects by class eventually", function (done) {
            var stop1      = [ new PitBoss("Craig"),  new PitBoss("Matthew") ],
                stop2      = [ new PitBoss("Brenda"), new PitBoss("Lauren"), new PitBoss("Kaitlyn") ],
                stop3      = [ new PitBoss("Phil") ],
                bus1       = new (CallbackHandler.extend({
                    $provide:[ PitBoss, function (resolution) {
                        expect(resolution.getMany()).to.be.true;
                        return Q.delay(stop1, 75);
                    }]
                })),
                bus2       = new (CallbackHandler.extend({
                    $provide:[ PitBoss, function (resolution) {
                        expect(resolution.getMany()).to.be.true;
                        return Q.delay(stop2, 100);
                    }]
                })),
                bus3       = new (CallbackHandler.extend({
                    $provide:[ PitBoss, function (resolution) {
                        expect(resolution.getMany()).to.be.true;
                        return Q.delay(stop3, 50);
                    }]
                })),
                company    = bus1.next(bus2, bus3);
            Q.when(company.resolveAll(PitBoss), function (pitBosses) {
                expect(pitBosses).to.eql(js.Array2.flatten([stop1, stop2, stop3]));
                done();
            }, function (error) { done(error); });
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

    describe("#next", function () {
        it("should cascade handlers using short syntax", function () {
            var guest    = new Guest(17),
                baccarat = new Activity('Baccarat'),
                level1   = new Level1Security(),
                level2   = new Level2Security(),
                security = CallbackHandler(level1).next(level2);
            expect(Security(security).admit(guest)).to.be.false;
            Security(security).trackActivity(baccarat);
        });

        it("should compose handlers using short syntax", function () {
            var baccarat = new Activity('Baccarat'),
                level1   = new Level1Security(),
                level2   = new Level2Security(),
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
});

describe("MethodCallbackHandler", function () {
    var Calculator = Protocol.extend({
        add:    function (op1, op2) {},
        divide: function (dividend, divisor) {},
        clear:  function () {}
    });

    describe("#handle", function () {
        it("should call function", function () {
            var add = new MethodCallbackHandler("add", function (op1, op2) {
                return op1 + op2;
            });
            expect(Calculator(add).add(5, 10)).to.equal(15);
        });

        it("should call function using short syntax", function () {
            var add = function (op1, op2) { return op1 + op2; }.implementing("add");
            expect(Calculator(add).add(22, 19)).to.equal(41);
        });

        it("should propgate exception in function", function () {
            var divide = new MethodCallbackHandler("divide", function (dividend, divisor) {
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
                clear   = new MethodCallbackHandler("clear", (function () {
                return context;
            }).bind(context));
            expect(Calculator(clear).clear()).to.equal(context);
        });

        it("should require non-empty method name", function () {
            expect(function () {
                new MethodCallbackHandler(null, function () {});
            }).to.throw(Error, /No methodName specified/);

            expect(function () {
                new MethodCallbackHandler(void 0, function () {});
            }).to.throw(Error, /No methodName specified/);

            expect(function () {
                new MethodCallbackHandler(10, function () {});
            }).to.throw(Error, /No methodName specified/);

            expect(function () {
                new MethodCallbackHandler("", function () {});
            }).to.throw(Error, /No methodName specified/);

            expect(function () {
                new MethodCallbackHandler("   ", function () {});
            }).to.throw(Error, /No methodName specified/);
        });
    });
});

describe("CascadeCallbackHandler", function () {
    describe("#handle", function () {
        it("should cascade handlers", function () {
            var guest    = new Guest(17),
                baccarat = new Activity('Baccarat'),
                level1   = new Level1Security(),
                level2   = new Level2Security(),
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
                level1 = CallbackHandler(new Level1Security());
            expect(Security(level1).admit(guest1)).to.be.false;
            expect(Security(level1).admit(guest2)).to.be.true;
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
                level1    = new Level1Security(),
                casino    = new Casino('Treasure Island')
                .addHandlers(level1, letItRide);

            expect(function () {
                Security(casino).trackActivity(letItRide)
            }).to.throw(Error, /has no method 'trackActivity'/);
        });

        it("can ignore missing methods", function () {
            var letItRide = new Activity('Let It Ride'),
                level1    = new Level1Security(),
                casino    = new Casino('Treasure Island')
                .addHandlers(level1, letItRide);
            expect(Security(casino.bestEffort()).trackActivity(letItRide)).to.be.undefined;
        });

        it("should require protocol conformance", function () {
            var gate  = new (CallbackHandler.extend(Security, {
                    admit: function (guest) { return true; }
                }));
            expect(Security(gate.strict()).admit(new Guest('Me'))).to.be.true;
        });

        it("should reject if no protocol conformance", function () {
            var gate  = new (CallbackHandler.extend({
                    admit: function (guest) { return true; }
                }));
            expect(function () {
                Security(gate.strict()).admit(new Guest('Me'))
            }).to.throw(Error, /has no method 'admit'/);
        });

        it("can broadcast invocations", function () {
            var letItRide = new Activity('Let It Ride'),
                level1    = new Level1Security(),
                level2    = new Level2Security(),
                casino    = new Casino('Treasure Island')
                .addHandlers(level1, level2, letItRide);
            Security(casino.broadcast()).trackActivity(letItRide);
        });

        it("can notify invocations", function () {
            var letItRide = new Activity('Let It Ride'),
                level1    = new Level1Security(),
                casino    = new Casino('Treasure Island')
                .addHandlers(level1, letItRide);
            Security(casino.notify()).trackActivity(letItRide);
        });
    })
});
