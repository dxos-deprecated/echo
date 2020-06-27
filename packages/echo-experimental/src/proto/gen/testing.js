/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.dxos = (function() {

    /**
     * Namespace dxos.
     * @exports dxos
     * @namespace
     */
    var dxos = {};

    dxos.echo = (function() {

        /**
         * Namespace echo.
         * @memberof dxos
         * @namespace
         */
        var echo = {};

        echo.testing = (function() {

            /**
             * Namespace testing.
             * @memberof dxos.echo
             * @namespace
             */
            var testing = {};

            testing.Envelope = (function() {

                /**
                 * Properties of an Envelope.
                 * @memberof dxos.echo.testing
                 * @interface IEnvelope
                 * @property {google.protobuf.IAny|null} [message] Envelope message
                 */

                /**
                 * Constructs a new Envelope.
                 * @memberof dxos.echo.testing
                 * @classdesc Represents an Envelope.
                 * @implements IEnvelope
                 * @constructor
                 * @param {dxos.echo.testing.IEnvelope=} [properties] Properties to set
                 */
                function Envelope(properties) {
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Envelope message.
                 * @member {google.protobuf.IAny|null|undefined} message
                 * @memberof dxos.echo.testing.Envelope
                 * @instance
                 */
                Envelope.prototype.message = null;

                /**
                 * Creates a new Envelope instance using the specified properties.
                 * @function create
                 * @memberof dxos.echo.testing.Envelope
                 * @static
                 * @param {dxos.echo.testing.IEnvelope=} [properties] Properties to set
                 * @returns {dxos.echo.testing.Envelope} Envelope instance
                 */
                Envelope.create = function create(properties) {
                    return new Envelope(properties);
                };

                /**
                 * Encodes the specified Envelope message. Does not implicitly {@link dxos.echo.testing.Envelope.verify|verify} messages.
                 * @function encode
                 * @memberof dxos.echo.testing.Envelope
                 * @static
                 * @param {dxos.echo.testing.IEnvelope} message Envelope message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Envelope.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                        $root.google.protobuf.Any.encode(message.message, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                    return writer;
                };

                /**
                 * Encodes the specified Envelope message, length delimited. Does not implicitly {@link dxos.echo.testing.Envelope.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof dxos.echo.testing.Envelope
                 * @static
                 * @param {dxos.echo.testing.IEnvelope} message Envelope message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Envelope.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes an Envelope message from the specified reader or buffer.
                 * @function decode
                 * @memberof dxos.echo.testing.Envelope
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {dxos.echo.testing.Envelope} Envelope
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Envelope.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.dxos.echo.testing.Envelope();
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.message = $root.google.protobuf.Any.decode(reader, reader.uint32());
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes an Envelope message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof dxos.echo.testing.Envelope
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {dxos.echo.testing.Envelope} Envelope
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Envelope.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies an Envelope message.
                 * @function verify
                 * @memberof dxos.echo.testing.Envelope
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                Envelope.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.message != null && message.hasOwnProperty("message")) {
                        var error = $root.google.protobuf.Any.verify(message.message);
                        if (error)
                            return "message." + error;
                    }
                    return null;
                };

                /**
                 * Creates an Envelope message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof dxos.echo.testing.Envelope
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {dxos.echo.testing.Envelope} Envelope
                 */
                Envelope.fromObject = function fromObject(object) {
                    if (object instanceof $root.dxos.echo.testing.Envelope)
                        return object;
                    var message = new $root.dxos.echo.testing.Envelope();
                    if (object.message != null) {
                        if (typeof object.message !== "object")
                            throw TypeError(".dxos.echo.testing.Envelope.message: object expected");
                        message.message = $root.google.protobuf.Any.fromObject(object.message);
                    }
                    return message;
                };

                /**
                 * Creates a plain object from an Envelope message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof dxos.echo.testing.Envelope
                 * @static
                 * @param {dxos.echo.testing.Envelope} message Envelope
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Envelope.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.defaults)
                        object.message = null;
                    if (message.message != null && message.hasOwnProperty("message"))
                        object.message = $root.google.protobuf.Any.toObject(message.message, options);
                    return object;
                };

                /**
                 * Converts this Envelope to JSON.
                 * @function toJSON
                 * @memberof dxos.echo.testing.Envelope
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Envelope.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return Envelope;
            })();

            testing.TestMessage = (function() {

                /**
                 * Properties of a TestMessage.
                 * @memberof dxos.echo.testing
                 * @interface ITestMessage
                 * @property {number|null} [seq] TestMessage seq
                 * @property {string|null} [id] TestMessage id
                 * @property {string|null} [depends] TestMessage depends
                 * @property {string|null} [tag] TestMessage tag
                 * @property {Object.<string,string>|null} [map] TestMessage map
                 */

                /**
                 * Constructs a new TestMessage.
                 * @memberof dxos.echo.testing
                 * @classdesc Represents a TestMessage.
                 * @implements ITestMessage
                 * @constructor
                 * @param {dxos.echo.testing.ITestMessage=} [properties] Properties to set
                 */
                function TestMessage(properties) {
                    this.map = {};
                    if (properties)
                        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * TestMessage seq.
                 * @member {number} seq
                 * @memberof dxos.echo.testing.TestMessage
                 * @instance
                 */
                TestMessage.prototype.seq = 0;

                /**
                 * TestMessage id.
                 * @member {string} id
                 * @memberof dxos.echo.testing.TestMessage
                 * @instance
                 */
                TestMessage.prototype.id = "";

                /**
                 * TestMessage depends.
                 * @member {string} depends
                 * @memberof dxos.echo.testing.TestMessage
                 * @instance
                 */
                TestMessage.prototype.depends = "";

                /**
                 * TestMessage tag.
                 * @member {string} tag
                 * @memberof dxos.echo.testing.TestMessage
                 * @instance
                 */
                TestMessage.prototype.tag = "";

                /**
                 * TestMessage map.
                 * @member {Object.<string,string>} map
                 * @memberof dxos.echo.testing.TestMessage
                 * @instance
                 */
                TestMessage.prototype.map = $util.emptyObject;

                /**
                 * Creates a new TestMessage instance using the specified properties.
                 * @function create
                 * @memberof dxos.echo.testing.TestMessage
                 * @static
                 * @param {dxos.echo.testing.ITestMessage=} [properties] Properties to set
                 * @returns {dxos.echo.testing.TestMessage} TestMessage instance
                 */
                TestMessage.create = function create(properties) {
                    return new TestMessage(properties);
                };

                /**
                 * Encodes the specified TestMessage message. Does not implicitly {@link dxos.echo.testing.TestMessage.verify|verify} messages.
                 * @function encode
                 * @memberof dxos.echo.testing.TestMessage
                 * @static
                 * @param {dxos.echo.testing.ITestMessage} message TestMessage message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                TestMessage.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.seq != null && Object.hasOwnProperty.call(message, "seq"))
                        writer.uint32(/* id 1, wireType 0 =*/8).int32(message.seq);
                    if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                        writer.uint32(/* id 2, wireType 2 =*/18).string(message.id);
                    if (message.depends != null && Object.hasOwnProperty.call(message, "depends"))
                        writer.uint32(/* id 3, wireType 2 =*/26).string(message.depends);
                    if (message.tag != null && Object.hasOwnProperty.call(message, "tag"))
                        writer.uint32(/* id 4, wireType 2 =*/34).string(message.tag);
                    if (message.map != null && Object.hasOwnProperty.call(message, "map"))
                        for (var keys = Object.keys(message.map), i = 0; i < keys.length; ++i)
                            writer.uint32(/* id 10, wireType 2 =*/82).fork().uint32(/* id 1, wireType 2 =*/10).string(keys[i]).uint32(/* id 2, wireType 2 =*/18).string(message.map[keys[i]]).ldelim();
                    return writer;
                };

                /**
                 * Encodes the specified TestMessage message, length delimited. Does not implicitly {@link dxos.echo.testing.TestMessage.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof dxos.echo.testing.TestMessage
                 * @static
                 * @param {dxos.echo.testing.ITestMessage} message TestMessage message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                TestMessage.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a TestMessage message from the specified reader or buffer.
                 * @function decode
                 * @memberof dxos.echo.testing.TestMessage
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {dxos.echo.testing.TestMessage} TestMessage
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                TestMessage.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.dxos.echo.testing.TestMessage(), key;
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.seq = reader.int32();
                            break;
                        case 2:
                            message.id = reader.string();
                            break;
                        case 3:
                            message.depends = reader.string();
                            break;
                        case 4:
                            message.tag = reader.string();
                            break;
                        case 10:
                            reader.skip().pos++;
                            if (message.map === $util.emptyObject)
                                message.map = {};
                            key = reader.string();
                            reader.pos++;
                            message.map[key] = reader.string();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a TestMessage message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof dxos.echo.testing.TestMessage
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {dxos.echo.testing.TestMessage} TestMessage
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                TestMessage.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a TestMessage message.
                 * @function verify
                 * @memberof dxos.echo.testing.TestMessage
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                TestMessage.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.seq != null && message.hasOwnProperty("seq"))
                        if (!$util.isInteger(message.seq))
                            return "seq: integer expected";
                    if (message.id != null && message.hasOwnProperty("id"))
                        if (!$util.isString(message.id))
                            return "id: string expected";
                    if (message.depends != null && message.hasOwnProperty("depends"))
                        if (!$util.isString(message.depends))
                            return "depends: string expected";
                    if (message.tag != null && message.hasOwnProperty("tag"))
                        if (!$util.isString(message.tag))
                            return "tag: string expected";
                    if (message.map != null && message.hasOwnProperty("map")) {
                        if (!$util.isObject(message.map))
                            return "map: object expected";
                        var key = Object.keys(message.map);
                        for (var i = 0; i < key.length; ++i)
                            if (!$util.isString(message.map[key[i]]))
                                return "map: string{k:string} expected";
                    }
                    return null;
                };

                /**
                 * Creates a TestMessage message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof dxos.echo.testing.TestMessage
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {dxos.echo.testing.TestMessage} TestMessage
                 */
                TestMessage.fromObject = function fromObject(object) {
                    if (object instanceof $root.dxos.echo.testing.TestMessage)
                        return object;
                    var message = new $root.dxos.echo.testing.TestMessage();
                    if (object.seq != null)
                        message.seq = object.seq | 0;
                    if (object.id != null)
                        message.id = String(object.id);
                    if (object.depends != null)
                        message.depends = String(object.depends);
                    if (object.tag != null)
                        message.tag = String(object.tag);
                    if (object.map) {
                        if (typeof object.map !== "object")
                            throw TypeError(".dxos.echo.testing.TestMessage.map: object expected");
                        message.map = {};
                        for (var keys = Object.keys(object.map), i = 0; i < keys.length; ++i)
                            message.map[keys[i]] = String(object.map[keys[i]]);
                    }
                    return message;
                };

                /**
                 * Creates a plain object from a TestMessage message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof dxos.echo.testing.TestMessage
                 * @static
                 * @param {dxos.echo.testing.TestMessage} message TestMessage
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                TestMessage.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    var object = {};
                    if (options.objects || options.defaults)
                        object.map = {};
                    if (options.defaults) {
                        object.seq = 0;
                        object.id = "";
                        object.depends = "";
                        object.tag = "";
                    }
                    if (message.seq != null && message.hasOwnProperty("seq"))
                        object.seq = message.seq;
                    if (message.id != null && message.hasOwnProperty("id"))
                        object.id = message.id;
                    if (message.depends != null && message.hasOwnProperty("depends"))
                        object.depends = message.depends;
                    if (message.tag != null && message.hasOwnProperty("tag"))
                        object.tag = message.tag;
                    var keys2;
                    if (message.map && (keys2 = Object.keys(message.map)).length) {
                        object.map = {};
                        for (var j = 0; j < keys2.length; ++j)
                            object.map[keys2[j]] = message.map[keys2[j]];
                    }
                    return object;
                };

                /**
                 * Converts this TestMessage to JSON.
                 * @function toJSON
                 * @memberof dxos.echo.testing.TestMessage
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                TestMessage.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return TestMessage;
            })();

            return testing;
        })();

        return echo;
    })();

    return dxos;
})();

$root.google = (function() {

    /**
     * Namespace google.
     * @exports google
     * @namespace
     */
    var google = {};

    google.protobuf = (function() {

        /**
         * Namespace protobuf.
         * @memberof google
         * @namespace
         */
        var protobuf = {};

        protobuf.Any = (function() {

            /**
             * Properties of an Any.
             * @memberof google.protobuf
             * @interface IAny
             * @property {string|null} [type_url] Any type_url
             * @property {Uint8Array|null} [value] Any value
             */

            /**
             * Constructs a new Any.
             * @memberof google.protobuf
             * @classdesc Represents an Any.
             * @implements IAny
             * @constructor
             * @param {google.protobuf.IAny=} [properties] Properties to set
             */
            function Any(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Any type_url.
             * @member {string} type_url
             * @memberof google.protobuf.Any
             * @instance
             */
            Any.prototype.type_url = "";

            /**
             * Any value.
             * @member {Uint8Array} value
             * @memberof google.protobuf.Any
             * @instance
             */
            Any.prototype.value = $util.newBuffer([]);

            /**
             * Creates a new Any instance using the specified properties.
             * @function create
             * @memberof google.protobuf.Any
             * @static
             * @param {google.protobuf.IAny=} [properties] Properties to set
             * @returns {google.protobuf.Any} Any instance
             */
            Any.create = function create(properties) {
                return new Any(properties);
            };

            /**
             * Encodes the specified Any message. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.Any
             * @static
             * @param {google.protobuf.IAny} message Any message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Any.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.type_url != null && Object.hasOwnProperty.call(message, "type_url"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.type_url);
                if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                    writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.value);
                return writer;
            };

            /**
             * Encodes the specified Any message, length delimited. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.Any
             * @static
             * @param {google.protobuf.IAny} message Any message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Any.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Any message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.Any
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.Any} Any
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Any.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.Any();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.type_url = reader.string();
                        break;
                    case 2:
                        message.value = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an Any message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.Any
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.Any} Any
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Any.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an Any message.
             * @function verify
             * @memberof google.protobuf.Any
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Any.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.type_url != null && message.hasOwnProperty("type_url"))
                    if (!$util.isString(message.type_url))
                        return "type_url: string expected";
                if (message.value != null && message.hasOwnProperty("value"))
                    if (!(message.value && typeof message.value.length === "number" || $util.isString(message.value)))
                        return "value: buffer expected";
                return null;
            };

            /**
             * Creates an Any message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.Any
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.Any} Any
             */
            Any.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.Any)
                    return object;
                var message = new $root.google.protobuf.Any();
                if (object.type_url != null)
                    message.type_url = String(object.type_url);
                if (object.value != null)
                    if (typeof object.value === "string")
                        $util.base64.decode(object.value, message.value = $util.newBuffer($util.base64.length(object.value)), 0);
                    else if (object.value.length)
                        message.value = object.value;
                return message;
            };

            /**
             * Creates a plain object from an Any message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.Any
             * @static
             * @param {google.protobuf.Any} message Any
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Any.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.type_url = "";
                    if (options.bytes === String)
                        object.value = "";
                    else {
                        object.value = [];
                        if (options.bytes !== Array)
                            object.value = $util.newBuffer(object.value);
                    }
                }
                if (message.type_url != null && message.hasOwnProperty("type_url"))
                    object.type_url = message.type_url;
                if (message.value != null && message.hasOwnProperty("value"))
                    object.value = options.bytes === String ? $util.base64.encode(message.value, 0, message.value.length) : options.bytes === Array ? Array.prototype.slice.call(message.value) : message.value;
                return object;
            };

            /**
             * Converts this Any to JSON.
             * @function toJSON
             * @memberof google.protobuf.Any
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Any.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Any;
        })();

        return protobuf;
    })();

    return google;
})();

module.exports = $root;