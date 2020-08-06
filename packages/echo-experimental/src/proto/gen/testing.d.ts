import * as $protobuf from "protobufjs";
/** Namespace dxos. */
export namespace dxos {

    /** Namespace echo. */
    namespace echo {

        /** Namespace testing. */
        namespace testing {

            /** Properties of an Envelope. */
            interface IEnvelope {

                /** Envelope message */
                message?: (google.protobuf.IAny|null);
            }

            /** Represents an Envelope. */
            class Envelope implements IEnvelope {

                /**
                 * Constructs a new Envelope.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: dxos.echo.testing.IEnvelope);

                /** Envelope message. */
                public message?: (google.protobuf.IAny|null);

                /**
                 * Creates a new Envelope instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Envelope instance
                 */
                public static create(properties?: dxos.echo.testing.IEnvelope): dxos.echo.testing.Envelope;

                /**
                 * Encodes the specified Envelope message. Does not implicitly {@link dxos.echo.testing.Envelope.verify|verify} messages.
                 * @param message Envelope message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: dxos.echo.testing.IEnvelope, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Envelope message, length delimited. Does not implicitly {@link dxos.echo.testing.Envelope.verify|verify} messages.
                 * @param message Envelope message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: dxos.echo.testing.IEnvelope, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an Envelope message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Envelope
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): dxos.echo.testing.Envelope;

                /**
                 * Decodes an Envelope message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Envelope
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): dxos.echo.testing.Envelope;

                /**
                 * Verifies an Envelope message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an Envelope message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Envelope
                 */
                public static fromObject(object: { [k: string]: any }): dxos.echo.testing.Envelope;

                /**
                 * Creates a plain object from an Envelope message. Also converts values to other types if specified.
                 * @param message Envelope
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: dxos.echo.testing.Envelope, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Envelope to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a FeedSeq. */
            interface IFeedSeq {

                /** FeedSeq feedKey */
                feedKey?: (string|null);

                /** FeedSeq seq */
                seq?: (number|null);
            }

            /** Represents a FeedSeq. */
            class FeedSeq implements IFeedSeq {

                /**
                 * Constructs a new FeedSeq.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: dxos.echo.testing.IFeedSeq);

                /** FeedSeq feedKey. */
                public feedKey: string;

                /** FeedSeq seq. */
                public seq: number;

                /**
                 * Creates a new FeedSeq instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns FeedSeq instance
                 */
                public static create(properties?: dxos.echo.testing.IFeedSeq): dxos.echo.testing.FeedSeq;

                /**
                 * Encodes the specified FeedSeq message. Does not implicitly {@link dxos.echo.testing.FeedSeq.verify|verify} messages.
                 * @param message FeedSeq message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: dxos.echo.testing.IFeedSeq, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified FeedSeq message, length delimited. Does not implicitly {@link dxos.echo.testing.FeedSeq.verify|verify} messages.
                 * @param message FeedSeq message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: dxos.echo.testing.IFeedSeq, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a FeedSeq message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns FeedSeq
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): dxos.echo.testing.FeedSeq;

                /**
                 * Decodes a FeedSeq message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns FeedSeq
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): dxos.echo.testing.FeedSeq;

                /**
                 * Verifies a FeedSeq message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a FeedSeq message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns FeedSeq
                 */
                public static fromObject(object: { [k: string]: any }): dxos.echo.testing.FeedSeq;

                /**
                 * Creates a plain object from a FeedSeq message. Also converts values to other types if specified.
                 * @param message FeedSeq
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: dxos.echo.testing.FeedSeq, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this FeedSeq to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a TimeStampedEnvelope. */
            interface ITimeStampedEnvelope {

                /** TimeStampedEnvelope timeStamp */
                timeStamp?: (dxos.echo.testing.IFeedSeq[]|null);

                /** TimeStampedEnvelope message */
                message?: (google.protobuf.IAny|null);
            }

            /** Represents a TimeStampedEnvelope. */
            class TimeStampedEnvelope implements ITimeStampedEnvelope {

                /**
                 * Constructs a new TimeStampedEnvelope.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: dxos.echo.testing.ITimeStampedEnvelope);

                /** TimeStampedEnvelope timeStamp. */
                public timeStamp: dxos.echo.testing.IFeedSeq[];

                /** TimeStampedEnvelope message. */
                public message?: (google.protobuf.IAny|null);

                /**
                 * Creates a new TimeStampedEnvelope instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns TimeStampedEnvelope instance
                 */
                public static create(properties?: dxos.echo.testing.ITimeStampedEnvelope): dxos.echo.testing.TimeStampedEnvelope;

                /**
                 * Encodes the specified TimeStampedEnvelope message. Does not implicitly {@link dxos.echo.testing.TimeStampedEnvelope.verify|verify} messages.
                 * @param message TimeStampedEnvelope message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: dxos.echo.testing.ITimeStampedEnvelope, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TimeStampedEnvelope message, length delimited. Does not implicitly {@link dxos.echo.testing.TimeStampedEnvelope.verify|verify} messages.
                 * @param message TimeStampedEnvelope message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: dxos.echo.testing.ITimeStampedEnvelope, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TimeStampedEnvelope message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TimeStampedEnvelope
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): dxos.echo.testing.TimeStampedEnvelope;

                /**
                 * Decodes a TimeStampedEnvelope message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TimeStampedEnvelope
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): dxos.echo.testing.TimeStampedEnvelope;

                /**
                 * Verifies a TimeStampedEnvelope message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TimeStampedEnvelope message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TimeStampedEnvelope
                 */
                public static fromObject(object: { [k: string]: any }): dxos.echo.testing.TimeStampedEnvelope;

                /**
                 * Creates a plain object from a TimeStampedEnvelope message. Also converts values to other types if specified.
                 * @param message TimeStampedEnvelope
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: dxos.echo.testing.TimeStampedEnvelope, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TimeStampedEnvelope to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a TestAdmit. */
            interface ITestAdmit {

                /** TestAdmit feedKey */
                feedKey?: (string|null);
            }

            /** Represents a TestAdmit. */
            class TestAdmit implements ITestAdmit {

                /**
                 * Constructs a new TestAdmit.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: dxos.echo.testing.ITestAdmit);

                /** TestAdmit feedKey. */
                public feedKey: string;

                /**
                 * Creates a new TestAdmit instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns TestAdmit instance
                 */
                public static create(properties?: dxos.echo.testing.ITestAdmit): dxos.echo.testing.TestAdmit;

                /**
                 * Encodes the specified TestAdmit message. Does not implicitly {@link dxos.echo.testing.TestAdmit.verify|verify} messages.
                 * @param message TestAdmit message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: dxos.echo.testing.ITestAdmit, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TestAdmit message, length delimited. Does not implicitly {@link dxos.echo.testing.TestAdmit.verify|verify} messages.
                 * @param message TestAdmit message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: dxos.echo.testing.ITestAdmit, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TestAdmit message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TestAdmit
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): dxos.echo.testing.TestAdmit;

                /**
                 * Decodes a TestAdmit message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TestAdmit
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): dxos.echo.testing.TestAdmit;

                /**
                 * Verifies a TestAdmit message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TestAdmit message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TestAdmit
                 */
                public static fromObject(object: { [k: string]: any }): dxos.echo.testing.TestAdmit;

                /**
                 * Creates a plain object from a TestAdmit message. Also converts values to other types if specified.
                 * @param message TestAdmit
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: dxos.echo.testing.TestAdmit, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TestAdmit to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a TestItemGenesis. */
            interface ITestItemGenesis {

                /** TestItemGenesis itemId */
                itemId?: (string|null);

                /** TestItemGenesis model */
                model?: (string|null);
            }

            /** Represents a TestItemGenesis. */
            class TestItemGenesis implements ITestItemGenesis {

                /**
                 * Constructs a new TestItemGenesis.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: dxos.echo.testing.ITestItemGenesis);

                /** TestItemGenesis itemId. */
                public itemId: string;

                /** TestItemGenesis model. */
                public model: string;

                /**
                 * Creates a new TestItemGenesis instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns TestItemGenesis instance
                 */
                public static create(properties?: dxos.echo.testing.ITestItemGenesis): dxos.echo.testing.TestItemGenesis;

                /**
                 * Encodes the specified TestItemGenesis message. Does not implicitly {@link dxos.echo.testing.TestItemGenesis.verify|verify} messages.
                 * @param message TestItemGenesis message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: dxos.echo.testing.ITestItemGenesis, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TestItemGenesis message, length delimited. Does not implicitly {@link dxos.echo.testing.TestItemGenesis.verify|verify} messages.
                 * @param message TestItemGenesis message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: dxos.echo.testing.ITestItemGenesis, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TestItemGenesis message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TestItemGenesis
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): dxos.echo.testing.TestItemGenesis;

                /**
                 * Decodes a TestItemGenesis message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TestItemGenesis
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): dxos.echo.testing.TestItemGenesis;

                /**
                 * Verifies a TestItemGenesis message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TestItemGenesis message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TestItemGenesis
                 */
                public static fromObject(object: { [k: string]: any }): dxos.echo.testing.TestItemGenesis;

                /**
                 * Creates a plain object from a TestItemGenesis message. Also converts values to other types if specified.
                 * @param message TestItemGenesis
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: dxos.echo.testing.TestItemGenesis, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TestItemGenesis to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a TestItemMutation. */
            interface ITestItemMutation {

                /** TestItemMutation itemId */
                itemId?: (string|null);

                /** TestItemMutation seq */
                seq?: (number|null);

                /** TestItemMutation id */
                id?: (string|null);

                /** TestItemMutation depends */
                depends?: (string|null);

                /** TestItemMutation tag */
                tag?: (string|null);

                /** TestItemMutation key */
                key?: (string|null);

                /** TestItemMutation value */
                value?: (string|null);

                /** TestItemMutation payload */
                payload?: (google.protobuf.IAny|null);
            }

            /** Represents a TestItemMutation. */
            class TestItemMutation implements ITestItemMutation {

                /**
                 * Constructs a new TestItemMutation.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: dxos.echo.testing.ITestItemMutation);

                /** TestItemMutation itemId. */
                public itemId: string;

                /** TestItemMutation seq. */
                public seq: number;

                /** TestItemMutation id. */
                public id: string;

                /** TestItemMutation depends. */
                public depends: string;

                /** TestItemMutation tag. */
                public tag: string;

                /** TestItemMutation key. */
                public key: string;

                /** TestItemMutation value. */
                public value: string;

                /** TestItemMutation payload. */
                public payload?: (google.protobuf.IAny|null);

                /**
                 * Creates a new TestItemMutation instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns TestItemMutation instance
                 */
                public static create(properties?: dxos.echo.testing.ITestItemMutation): dxos.echo.testing.TestItemMutation;

                /**
                 * Encodes the specified TestItemMutation message. Does not implicitly {@link dxos.echo.testing.TestItemMutation.verify|verify} messages.
                 * @param message TestItemMutation message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: dxos.echo.testing.ITestItemMutation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TestItemMutation message, length delimited. Does not implicitly {@link dxos.echo.testing.TestItemMutation.verify|verify} messages.
                 * @param message TestItemMutation message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: dxos.echo.testing.ITestItemMutation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TestItemMutation message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TestItemMutation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): dxos.echo.testing.TestItemMutation;

                /**
                 * Decodes a TestItemMutation message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TestItemMutation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): dxos.echo.testing.TestItemMutation;

                /**
                 * Verifies a TestItemMutation message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TestItemMutation message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TestItemMutation
                 */
                public static fromObject(object: { [k: string]: any }): dxos.echo.testing.TestItemMutation;

                /**
                 * Creates a plain object from a TestItemMutation message. Also converts values to other types if specified.
                 * @param message TestItemMutation
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: dxos.echo.testing.TestItemMutation, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TestItemMutation to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }
    }
}

/** Namespace google. */
export namespace google {

    /** Namespace protobuf. */
    namespace protobuf {

        /** Properties of an Any. */
        interface IAny {

            /** Any type_url */
            type_url?: (string|null);

            /** Any value */
            value?: (Uint8Array|null);
        }

        /** Represents an Any. */
        class Any implements IAny {

            /**
             * Constructs a new Any.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IAny);

            /** Any type_url. */
            public type_url: string;

            /** Any value. */
            public value: Uint8Array;

            /**
             * Creates a new Any instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Any instance
             */
            public static create(properties?: google.protobuf.IAny): google.protobuf.Any;

            /**
             * Encodes the specified Any message. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
             * @param message Any message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IAny, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Any message, length delimited. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
             * @param message Any message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IAny, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Any message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Any
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Any;

            /**
             * Decodes an Any message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Any
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Any;

            /**
             * Verifies an Any message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Any message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Any
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Any;

            /**
             * Creates a plain object from an Any message. Also converts values to other types if specified.
             * @param message Any
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Any, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Any to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }
}
