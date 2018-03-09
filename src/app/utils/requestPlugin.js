import merge from 'lodash/merge';
import { create } from 'axios';

export default () => ({
  name: 'RequestPlugin',

  plugContext(contextOptions) {
    const axios = create(
      merge(
        {
          baseURL: 'https://permsproject.com',
          timeout: 6000,
          headers: { accept: 'application/vnd.comon-v1+json' },
        },
        contextOptions.axiosConfig || {},
      ),
    );

    const request = async (url, options = {}) => {
      try {
        const response = await axios(
          Object.assign(
            {
              method: 'GET',
              url: url.startsWith('http:') ? url.replace(/^http:/, 'https:') : url,
            },
            options,
          ),
        );
        return response;
      } catch (error) {
        return { error };
      }
    };

    Object.assign(request, {
      get(url, options = {}) {
        return request(url, Object.assign({ method: 'GET' }, options));
      },

      post(url, options = {}) {
        return request(url, Object.assign({ method: 'POST' }, options));
      },

      put(url, options = {}) {
        return request(url, Object.assign({ method: 'PUT' }, options));
      },

      del(url, options = {}) {
        return request(url, Object.assign({ method: 'DELETE' }, options));
      },
    });

    return {
      plugActionContext(actionContext) {
        Object.assign(actionContext, { request });
      },

      plugComponentContext(componentContext) {
        Object.assign(componentContext, { request });
      },
    };
  },
});
