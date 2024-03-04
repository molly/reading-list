import axios from 'axios';
import { DateTime } from 'luxon';
import '../../css/feed-editor.css';
import {
  getSlugFromTitle,
  socialLinksToArray,
  socialLinksToMap,
} from './helpers/editorHelpers.js';

import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import InlineCode from '@editorjs/inline-code';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';

import ImageTool from '@editorjs/image';
import LinkTool from '@editorjs/link';
import RawTool from '@editorjs/raw';
import debounce from 'lodash.debounce';
import TomSelect from 'tom-select';
import MentionsTool from './MentionsTool.js';

const postMeta = {
  title: '',
  slug: DateTime.now().toFormat('yyyyMMddHHmm'),
  tags: [],
  relatedPost: null,
  relatedPostModel: null,
  id: null,
  socialLinks: {},
};
let savedPost = {};
let tagSelect;
let relatedPostsSelect;

// Change handlers
function onTitleChange() {
  const slugElement = document.getElementById('slug');
  if (postMeta.slug === getSlugFromTitle(postMeta.title)) {
    postMeta.slug = getSlugFromTitle(this.value);
    slugElement.value = postMeta.slug;
  }
  postMeta.title = this.value;
}
const debouncedOnTitleChange = debounce(onTitleChange, 250);

function onSlugChange() {
  postMeta.slug = this.value;
}
const debouncedOnSlugChange = debounce(onSlugChange, 250);

function onSocialChange() {
  if (this.value) {
    postMeta.socialLinks[this.id] = this.value;
  } else {
    delete postMeta.socialLinks[this.id];
  }
}
const debouncedOnSocialChange = debounce(onSocialChange, 250);

// Helpers to keep form in sync with DB after save
function updateModelFromDb(data) {
  savedPost = data;
  postMeta.title = data.title;
  postMeta.slug = data.slug;
  postMeta.tags = data.tags;
  postMeta.id = data.id;
  postMeta.relatedPost = data.relatedPost;
  postMeta.relatedPostModel = data.relatedPostModel;
  postMeta.socialLinks = socialLinksToMap(data.socialLinks);
}

function setInputValues() {
  const titleEl = document.getElementById('title');
  const slugEl = document.getElementById('slug');
  const lastEdited = document.getElementById('last-edited');

  titleEl.value = postMeta.title;
  slugEl.value = postMeta.slug;
  tagSelect.setValue(postMeta.tags);
  relatedPostsSelect.setValue(postMeta.relatedPost);
  Object.entries(postMeta.socialLinks).forEach(([key, value]) => {
    document.getElementById(key).value = value;
  });
  if (savedPost.updatedAt) {
    slugEl.setAttribute('disabled', true);
    lastEdited.textContent = `Last edited: ${DateTime.fromISO(savedPost.updatedAt).toLocaleString(DateTime.DATETIME_FULL)}`;
  }
}

async function onFirstLoad() {
  // Load data
  const slug = window.location.pathname.split('/').slice(3);
  if (slug.length) {
    try {
      const resp = await axios.get(`/dynamic-api/micro/entry/${slug}`);
      if (resp) {
        updateModelFromDb(resp.data);
      } else {
        throw new Error('No post found');
      }
    } catch (err) {
      if (err && err.response && err.response.status === 404) {
        document.querySelector('#error-overlay .error-message').textContent =
          `No post with the slug "${slug}" was found.`;
        document.getElementById('loading-overlay').classList.add('hidden');
        document.getElementById('error-overlay').classList.remove('hidden');
        return;
      }
      throw err;
    }
  }

  // Load editor
  const editor = new EditorJS({
    holder: 'editorjs',
    autofocus: true,
    tools: {
      header: Header,
      image: {
        class: ImageTool,
        config: {
          endpoints: {
            byFile: '/dynamic-api/micro/image/byFile',
            byUrl: '/dynamic-api/micro/image/byUrl',
          },
          types: 'image/*, video/*',
          actions: [
            {
              name: 'white',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">  <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>',
              title: 'Has white background',
              toggle: true,
            },
          ],
        },
      },
      inlineCode: InlineCode,
      linkTool: LinkTool,
      list: {
        class: List,
        inlineToolbar: true,
        config: { defaultStyle: 'unordered' },
      },
      mentions: MentionsTool,
      quote: Quote,
      raw: RawTool,
    },
    data: savedPost.post || {},
  });

  // Load TomSelect for tags editor
  const { data: tagOptions } = await axios.get('/dynamic-api/tags');
  tagSelect = new TomSelect('#tags', {
    create: true,
    items: postMeta.tags,
    valueField: '_id',
    searchField: ['text'],
    options: tagOptions,
    maxOptions: null,
    closeAfterSelect: true,
  });

  // Load TomSelect for related posts
  const { data: relatedOptions } = await axios.get(
    '/dynamic-api/micro/relatedPosts',
  );
  relatedPostsSelect = new TomSelect('#related', {
    items: postMeta.relatedPost,
    valueField: '_id',
    labelField: 'title',
    searchField: ['title'],
    options: relatedOptions,
    allowEmptyOption: true,
  });

  // Selectors
  const titleEl = document.getElementById('title');
  const slugEl = document.getElementById('slug');
  const saveButton = document.getElementById('save-button');

  // Set initial values
  setInputValues();

  // Attach handlers
  titleEl.addEventListener('keydown', debouncedOnTitleChange);
  slugEl.addEventListener('keydown', debouncedOnSlugChange);
  document
    .querySelectorAll('.social-post-id')
    .forEach((el) => el.addEventListener('keydown', debouncedOnSocialChange));

  // TomSelect uses .on
  tagSelect.on('change', function (value) {
    if (value) {
      postMeta.tags = value.split(',');
    } else {
      postMeta.tags = [];
    }
  });
  relatedPostsSelect.on('change', function (value) {
    if (value) {
      postMeta.relatedPost = value;
      postMeta.relatedPostModel = relatedOptions.find(
        (opt) => opt._id === value,
      ).type;
    } else {
      postMeta.relatedPost = null;
      postMeta.relatedPostModel = null;
    }
  });

  saveButton.addEventListener('click', function () {
    saveButton.setAttribute('disabled', true);
    editor.save().then((savedData) => {
      // Update or create
      const endpoint = savedPost._id
        ? `/dynamic-api/micro/entry/${savedPost._id}`
        : '/dynamic-api/micro/entry';
      const transformedPostMeta = {
        ...postMeta,
        socialLinks: socialLinksToArray(postMeta.socialLinks),
      };
      axios
        .post(endpoint, {
          ...transformedPostMeta,
          post: savedData,
        })
        .then((resp) => {
          return Promise.all([
            Promise.resolve(resp),
            axios.get('/dynamic-api/tags'),
          ]);
        })
        .then(([resp, tags]) => {
          tagSelect.clearOptions();
          tagSelect.addOptions(tags.data);
          updateModelFromDb(resp.data);
          setInputValues();
          saveButton.removeAttribute('disabled');
          window.history.pushState({}, null, `/micro/editor/${resp.data.slug}`);
        });
    });
  });

  // Ready
  document.getElementById('loading-overlay').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', onFirstLoad);
