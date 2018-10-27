# mongoose-generate-unique-key

## Motivation
We often want short readable unique keys for our documents.  ObjectIds are too long and ugly.

[nanoid](https://github.com/ai/nanoid) addresses this problem quite well, but it still generates longer ids than we really need.  With the nanoid approach, you must make your key size large enough that a collision with the existing set of ids will be astronomically unlikely. 

### Our solution

- Generate a random id, but even smaller than a nanoid.
- Check if there is a collision, and if there is, try again.

With this approach, our key size only needs to be around twice as large as than the maximum number of unique keys we want to generate.  (Even with a 50% chance of each tested key colliding, it won't take long to find an unused key.  But do check the caveats below.)

## Usage

    const schema = new Schema({
      _id: { type: Number },
      // ...
    });

    userSchema.plugin(generateUniqueKey(() => String(Math.floor(Math.random() * 1000000))));

If no field is specified, the `_id` field is assumed.  But you can specify a field name if you want to:

    userSchema.plugin(generateUniqueKey('userKey', () => String(Math.floor(Math.random() * 1000000))));

Of course it is recommended that you index the field.

### What is the down side?

- When you create a document, you cannot use its _id yet.  You need to save it, and then check what _id was generated for that document.

### Caveats

1. Our collision check is asynchronous, performed before the save happens.  If you are often saving multiple documents to the DB in parallel, there is a small risk that two documents will generate the exact same unused id at the same time.

   To avoid that, we recommend you set your key size to 100 times the maximum number of ids you will generate.  (We should do a more detailed check on this math later.  It's the birthday problem, but only 1-1, not 1-set like nanoid.)

2. If you are saving a lot of documents every second, then you might want to avoid the multiple queries needed to find an unused key.  In that case, setting the key size to 100 times the maximum will also help reduce the number of checks made.

   That said, if you are saving a lot of documents in parallel every second, then you should probably be more concerned about DB performance than key size.  In that case, we recommend using nanoid, or good old ObjectIds.

3. If you are generating random ids because you don't want your ids to be predictable, then bear in mind that choosing a smaller key size means attackers will be able to discover your document ids more easily, even if they cannot predict them.

## TODO

- Offer some common key generating routines
- Offer a recommendedKeySize calculator that can be used directly from the code
- Warn if the field is not indexed

## Alternatives

Instead of generating random ids, it might be simpler to simply opt for auto-incrementing ids.

- [mongoose-auto-increment](https://www.npmjs.com/package/mongoose-auto-increment) can do that for you.  By using an atomic `$inc` on a single document, collisions should never happen.
