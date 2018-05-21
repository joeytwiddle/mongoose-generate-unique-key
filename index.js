module.exports = function generateUniqueKey (fieldName, generator) {
  if (typeof fieldName === 'function' && !generator) {
    generator = fieldName;
    fieldName = '_id';
  }

  return function generateUniqueKeyPlugin (schema, innerOptions) {
    schema.pre('validate', function (next) {
      const document = this;

      if (!document.isNew) {
        next();
        return;
      }

      // All mongoose documents are given an initial _id, so we will overwrite that silently.
      // But for other field names, we don't expect the field to have a value set, since we are just going to overwrite it.
      // In that case, we assume the developer did not expect the field to be overwritten, so we warn them.
      if (fieldName !== '_id' && document[fieldName]) {
        console.warn("[generate-unique-key] Overwriting existing value for '" + fieldName + "': '" + JSON.stringify(document[fieldName]) + "'");
      }

      generateUniqueValue(document, fieldName, generator).then(function (newValue) {
        document[fieldName] = newValue;
        next();
      }).catch(next);
    });
  };
};

function generateUniqueValue (document, fieldName, generator) {
  const newValue = generator(document);

  const Model = document.constructor;
  const collection = Model.collection;

  const query = {};
  query[fieldName] = newValue;
  return collection.findOne(query).then(function (found) {
    if (found) {
      // Try again
      return generateUniqueValue(document, fieldName, generator);
    }
    // Not found, we can use this value
    return newValue;
  });
}
