/* CALLER 主叫 CALLEE 被叫 */
const CALLKIT_EVENT_CODE = {
    CALLER_ACCPET: 0,
    CALLEE_ACCPET: 1,
    CALLER_BUSY: 2,
    CALLEE_BUSY: 3,
    CALLER_REFUSE: 4,
    CALLEE_REFUSE: 5,
    HANGUP: 6,
    TIMEOUT: 7,
    CANCEL: 8,
    CALLER_CANCEL: 9,
}
const CALLKIT_EVENT_TYPE = {
    [CALLKIT_EVENT_CODE.CALLER_ACCPET]: {
        code: CALLKIT_EVENT_CODE.CALLER_ACCPET,
        description: 'CALLER_ACCPET',
    },
    [CALLKIT_EVENT_CODE.CALLEE_ACCPET]: {
        code: CALLKIT_EVENT_CODE.CALLEE_ACCPET,
        description: 'CALLEE_ACCPET',
    },
    [CALLKIT_EVENT_CODE.CALLER_BUSY]: {
        code: CALLKIT_EVENT_CODE.CALLER_BUSY,
        description: 'CALLER_BUSY',
    },
    [CALLKIT_EVENT_CODE.CALLEE_BUSY]: {
        code: CALLKIT_EVENT_CODE.CALLEE_BUSY,
        description: 'CALLEE_BUSY',
    },
    [CALLKIT_EVENT_CODE.CALLER_REFUSE]: {
        code: CALLKIT_EVENT_CODE.CALLER_REFUSE,
        description: 'CALLER_REFUSE',
    },
    [CALLKIT_EVENT_CODE.CALLEE_REFUSE]: {
        code: CALLKIT_EVENT_CODE.CALLEE_REFUSE,
        description: 'CALLEE_REFUSE',
    },
    [CALLKIT_EVENT_CODE.HANGUP]: {
        code: CALLKIT_EVENT_CODE.HANGUP,
        description: 'HANGUP',
    },
    [CALLKIT_EVENT_CODE.TIMEOUT]: {
        code: CALLKIT_EVENT_CODE.TIMEOUT,
        description: 'TIMEOUT',
    },
    [CALLKIT_EVENT_CODE.CANCEL]: {
        code: CALLKIT_EVENT_CODE.CANCEL,
        description: 'CANCEL',
    },
    [CALLKIT_EVENT_CODE.CALLER_CANCEL]: {
        code: CALLKIT_EVENT_CODE.CALLER_CANCEL,
        description: 'CALLER_CANCEL',
    },
}

export { CALLKIT_EVENT_CODE, CALLKIT_EVENT_TYPE }
