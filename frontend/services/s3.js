import axios from 'axios';
import RNBlobUtil from 'react-native-blob-util';

const getSignedRequest = async (file) => {
  const ROOT_URL = 'https://aws-upload-gkgt.onrender.com/api';
  const fileName = encodeURIComponent(file.name);
  const response = await axios.get(
    `${ROOT_URL}/sign-s3?file-name=${fileName}&file-type=${file.type}`,
  );
  return response.data;
};

const uploadFileToS3 = async (signedRequest, file, url) => {
  try {
    const filePath = decodeURIComponent(file.uri.replace('file://', ''));
    const res = await RNBlobUtil.fetch(
      'PUT',
      signedRequest,
      {
        'Content-Type': file.type,
      },
      RNBlobUtil.wrap(filePath),
    );
    return url;
  } catch (err) {
    console.error('Profile picture upload failed:', err);
    throw err;
  }
};

const uploadImage = async (file) => {
  const { signedRequest, url } = await getSignedRequest(file);
  return await uploadFileToS3(signedRequest, file, url);
};

export default uploadImage;
