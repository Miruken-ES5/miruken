/* 
 * The MIT License
 *
 * Copyright 2016 Craig Neuwirt, Michael Dudley.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

new function(){

  base2.package(this, {
    name:     "loggers",
    imports:  "miruken",
    exports:  "Logger,ConsoleLogger,NotificationLogger"
  });

  eval(this.imports);

  // we need a base logger to capture all the messages
  const Logger = Base.extend({
    LOG: "Log",
    INFO: "Info",
    WARNING: "Warning",
    ERROR: "Error",
    DEBUG: "Debug",
    logEntries: [],

    log: function (message){
      logEntries.push({type: LOG, content: message});
    },

    info: function (message){
      logEntries.push({type: INFO, content: message});
    },

    warning: function (message){
      logEntries.push({type: WARNING, content: message});
    },

    error: function (message){
      logEntries.push({type: ERROR, content: message});
    },

    debug: function (message){
      logEntries.push({type: DEBUG, content: message});
    },

    getMessages: function (type){
      if (type) {
        return logEntries.every(entry => entry.type === type);
      }else{
        return logEntries;
      };
    }
  });

  // now extend to create a console logger
  const ConsoleLogger = Logger.extend({
    log: function (message){
      //this.log(message);
      console.log(message);
    },

    info: function (message){
      //this.info(message);
      console.info(message);
    },

    warning: function (message){
      //this.warning(message);
      console.warn(message);
    },

    error: function (message){
      //this.error(message);
      console.error(message);
    },

    debug: function (message){
      //this.debug(message);
      console.debug(message);
    }
  });

  // now extend to create a notification logger
  const NotificationLogger = Logger.extend({
    log: function (message){
      //this.log(message);
      alert(this.LOG + ":\n\n" + message);
    },

    info: function (message){
      //this.info(message);
      alert(this.INFO + ":\n\n" + message);
    },

    warning: function (message){
      //this.warning(message);
      alert(this.WARNING + ":\n\n" + message);
    },

    error: function (message){
      //this.error(message);
      alert(this.ERROR + ":\n\n" + message);
    },

    debug: function (message){
      //this.debug(message);
      alert(this.DEBUG + ":\n\n" + message);
    }
  });

  eval(this.exports);

};
