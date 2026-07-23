import {
  DEFAULT_EASEMOB_APPKEY,
  DEFAULT_EASEMOB_REST_URL,
  DEFAULT_EASEMOB_SOCKET_URL,
} from '@/IM/config';

export const IM_ENVIRONMENTS = {
  VIP6: 'VIP6',
  TKE: 'TKE',
  DEV: 'DEV',
  QA: 'QA',
  NGI: 'NGI',
};

export const IM_ENV_OPTIONS = [
  { label: '线上 VIP6', value: IM_ENVIRONMENTS.VIP6 },
  { label: 'TKE', value: IM_ENVIRONMENTS.TKE },
  { label: 'DEV', value: IM_ENVIRONMENTS.DEV },
  { label: 'QA隔舱', value: IM_ENVIRONMENTS.QA },
  { label: 'NGI', value: IM_ENVIRONMENTS.NGI },
];

const BASE_ENV_CONFIG = {
  environment: IM_ENVIRONMENTS.NGI,
  appKey: DEFAULT_EASEMOB_APPKEY,
  isPrivate: false,
  imServer: '',
  port: '',
  restServer: '',
};

const PRIVATE_ENV_DEFAULTS = {
  appKey: DEFAULT_EASEMOB_APPKEY,
  isPrivate: true,
  imServer: DEFAULT_EASEMOB_SOCKET_URL,
  port: '',
  restServer: DEFAULT_EASEMOB_REST_URL,
};

const ENV_PRIVATE_CONFIGS = {
  [IM_ENVIRONMENTS.VIP6]: {
    appKey: DEFAULT_EASEMOB_APPKEY,
    restServer: 'https://ovuni-rest.easemob.com',
    imServer: 'ovuni-websocket.easemob.com/websocket',
  },
  [IM_ENVIRONMENTS.TKE]: {
    appKey: 'easemob-demo#qatkeflink',
    restServer: 'https://tke-sdb-a1.easemob.com',
    imServer: 'tke-sdb-im-api-wechat.easemob.com/websocket',
  },
  [IM_ENVIRONMENTS.DEV]: {
    appKey: 'easemob-demo#sdk111',
    restServer: 'https://a1-hsb.easemob.com',
    imServer: 'im-api-new-hsb.easemob.com/websocket',
  },
  [IM_ENVIRONMENTS.QA]: {
    appKey: 'easemob-demo#qatest',
    restServer: 'http://test.isolation.qa.easemob.com',
    imServer: 'ws://test.isolation.qa.easemob.com:4200/websocket',
  },
};

export function createImEnvironmentConfig(environment) {
  const env = environment || IM_ENVIRONMENTS.NGI;

  if (env === IM_ENVIRONMENTS.NGI || env === IM_ENVIRONMENTS.VIP6) {
    return {
      ...BASE_ENV_CONFIG,
      environment: env,
      isPrivate: false,
    };
  }

  return {
    ...BASE_ENV_CONFIG,
    ...PRIVATE_ENV_DEFAULTS,
    ...ENV_PRIVATE_CONFIGS[env],
    environment: env,
  };
}

export function normalizeImEnvironmentConfig(config = {}) {
  const environment = config.environment || IM_ENVIRONMENTS.NGI;
  return {
    ...createImEnvironmentConfig(environment),
    ...config,
    environment,
    isPrivate:
      environment === IM_ENVIRONMENTS.NGI || environment === IM_ENVIRONMENTS.VIP6
        ? false
        : config.isPrivate ?? true,
  };
}
