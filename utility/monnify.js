import axios from 'axios';

const authenticateMonnify = async (apiKey, apiSecret) => {
  try {
    const authString = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const { data } = await axios.post(
      'https://api.monnify.com/api/v1/auth/login',
      {},
      {
        headers: {
          Authorization: `Basic ${authString}`,
        },
      }
    );
    return data.responseBody.accessToken;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to authenticate with Monnify');
  }
};

const createMonnifyAccount = async (apiToken, user) => {
  try {
    const { data } = await axios.post(
      'https://api.monnify.com/api/v2/bank-transfer/reserved-accounts',
      {
        accountReference: user._id,
        accountName: user.username,
        currencyCode: 'NGN',
        contractCode: '440026499445',
        customerEmail: user.email,
        bvn: '22466031424',
        customerName: user.username,
        getAllAvailableBanks: true,
      },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );
    return data;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to create Monnify account');
  }
};

export { authenticateMonnify, createMonnifyAccount };
