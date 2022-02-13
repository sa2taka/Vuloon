import {
  SerializableAfterTamperingRequestListenerParameter,
  SerializableResponseListenerParameter,
} from '@/@types/serializableProxyParameter';

export type onResponseParameter = [
  string,
  SerializableResponseListenerParameter,
  SerializableAfterTamperingRequestListenerParameter
];
