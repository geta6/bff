import keyMirror from 'fbjs/lib/keyMirror';

export default (displayName, actions) =>
  Object.assign(
    async (context, payload) => {
      const actionType = payload.get('type');
      const action = actions[actionType];
      if (!action) throw new Error(`Invalid action type executed on ${displayName}.`);
      const res = await action.call(actions, { context, payload });
      return res;
    },
    { displayName, actionTypes: keyMirror(actions) },
  );
