import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';

const PhoneBookSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  title: {
    type: String,
    required: true,
  },
  contacts: [
    {
      type: String,
      validate: {
        validator: function (value) {
          return this.contacts.indexOf(value) === this.contacts.lastIndexOf(value);
        },
        message: 'Contact numbers must be unique within the array.',
      },
    },
  ],
  total_contacts: {
    type: Number,
    default: 0,
  },
  country_code: {
    type: String,
    default: '234',
  },
  country: {
    type: String,
    default: 'Nigeria',
  },
});

PhoneBookSchema.plugin(timestamps);

const PhoneBook = mongoose.model('PhoneBook', PhoneBookSchema);

export default PhoneBook;
