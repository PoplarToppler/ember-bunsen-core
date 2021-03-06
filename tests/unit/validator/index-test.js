import {expect} from 'chai'
import _ from 'lodash'
import {it} from 'ember-mocha'
import {beforeEach, describe} from 'mocha'
import validate from 'bunsen-core/validator'
// import viewSchema from 'bunsen-core/validator/view-schema'
// import readmeContents from '!!raw!../../../README.md'
import missingReqAttrs from './fixtures/invalid/missing-required-attributes'
import invalidTypeVersion from './fixtures/invalid/invalid-type-version'
import simpleFormConfig from './fixtures/simple-form'
import simpleFormModel from './fixtures/simple-form-model'
import badCells from './fixtures/invalid/bad-cells'
import multipleCells from './fixtures/multiple-cells'
import transforms from './fixtures/transforms'

describe('Unit: validator', function () {
  let result

  // TODO: get test working
  /* describe('README.md view schema', function () {
    let readmeSchema
    beforeEach(function () {
      const lines = readmeContents.split('\n')
      let startIndex = lines.indexOf('<!-- BEGIN view-schema.json -->') + 1
      let endIndex = lines.indexOf('<!-- END view-schema.json -->')
      const trimmedLines = lines.slice(startIndex, endIndex)
      startIndex = trimmedLines.indexOf('```json') + 1
      endIndex = trimmedLines.indexOf('```')
      const jsonLines = trimmedLines.slice(startIndex, endIndex)

      readmeSchema = JSON.parse(jsonLines.join('\n'))
    })

    it('matches the schema used by the code', function () {
      expect(readmeSchema).deep.equal(viewSchema)
    })
  }) */

  describe('.validate()', function () {
    describe('when valid', function () {
      beforeEach(function () {
        result = validate(simpleFormConfig, simpleFormModel)
      })

      it('validates', function () {
        expect(result).to.eql({
          errors: [],
          warnings: []
        })
      })
    })

    // Testing various ways to define cells
    ;[
      {
        cells: [
          {
            model: 'foo'
          }
        ],
        type: 'form',
        version: '2.0'
      },
      {
        cellDefinitions: {
          foo: {
            model: 'foo'
          }
        },
        cells: [
          {
            extends: 'foo'
          }
        ],
        type: 'form',
        version: '2.0'
      },
      {
        cells: [
          {
            children: [
              {
                model: 'foo'
              }
            ]
          }
        ],
        type: 'form',
        version: '2.0'
      },
      {
        cellDefinitions: {
          foo: {
            model: 'foo'
          }
        },
        cells: [
          {
            children: [
              {
                extends: 'foo'
              }
            ]
          }
        ],
        type: 'form',
        version: '2.0'
      },
      {
        cellDefinitions: {
          foo: {
            children: [
              {
                model: 'foo'
              }
            ]
          }
        },
        cells: [
          {
            extends: 'foo'
          }
        ],
        type: 'form',
        version: '2.0'
      },
      {
        containers: [
          {
            id: 'main',
            rows: [
              [
                {
                  model: 'foo'
                }
              ]
            ]
          }
        ],
        rootContainers: [
          {
            container: 'main',
            label: 'Main'
          }
        ],
        type: 'form',
        version: '1.0'
      }
    ]
      .forEach((view) => {
        describe('when valid', function () {
          var result

          beforeEach(() => {
            const model = {
              properties: {
                foo: {
                  type: 'string'
                }
              },
              type: 'object'
            }

            const renderers = []

            function validateRenderer (rendererName) {
              return rendererName === 'foo-bar-renderer'
            }

            result = validate(view, model, renderers, validateRenderer)
          })

          it('returns proper result', function () {
            expect(result).deep.equal({
              errors: [],
              warnings: []
            })
          })
        })
      })

    describe('when valid', function () {
      var result

      beforeEach(() => {
        const model = {
          type: 'object',
          properties: {
            nested: {
              type: 'object',
              properties: {
                foo: {
                  type: 'object',
                  properties: {
                    foosValue: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }

        const view = {
          type: 'form',
          version: '2.0',
          cells: [
            {
              children: [
                {
                  label: 'Main',
                  model: 'nested',
                  children: [
                    {
                      label: 'Foo',
                      model: 'foo',
                      children: [
                        {
                          label: 'value',
                          model: 'foosValue'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }

        const renderers = []

        function validateRenderer (rendererName) {
          return rendererName === 'foo-bar-renderer'
        }

        result = validate(view, model, renderers, validateRenderer)
      })

      it('returns proper result', function () {
        expect(result).deep.equal({
          errors: [],
          warnings: []
        })
      })
    })

    describe('when valid', function () {
      var result

      beforeEach(function () {
        const model = {
          properties: {
            foo: {
              properties: {
                bar: {
                  properties: {
                    baz: {
                      type: 'string'
                    }
                  },
                  type: 'object'
                }
              },
              type: 'object'
            }
          },
          type: 'object'
        }

        const view = {
          cells: [
            {
              children: [
                {
                  model: 'baz'
                }
              ],
              model: 'foo.bar'
            }
          ],
          type: 'form',
          version: '2.0'
        }

        const renderers = []

        function validateRenderer (rendererName) {
          return rendererName === 'foo-bar-renderer'
        }

        function validateModelType () {
          return true
        }

        result = validate(view, model, renderers, validateRenderer, validateModelType)
      })

      it('returns proper result', function () {
        expect(result).deep.equal({
          errors: [],
          warnings: []
        })
      })
    })

    describe('when required attributes are missing', function () {
      beforeEach(function () {
        result = validate(missingReqAttrs, simpleFormModel)
      })

      it('reports missing "version"', function () {
        expect(result.errors).to.containSubset([{
          message: 'Field is required.',
          path: '#/version'
        }])
      })

      it('reports missing "type"', function () {
        expect(result.errors).to.containSubset([{
          message: 'Field is required.',
          path: '#/type'
        }])
      })

      it('reports missing "cells"', function () {
        expect(result.errors).to.containSubset([{
          message: 'Field is required.',
          path: '#/cells'
        }])
      })
    })

    describe('when version and type are invalid', function () {
      beforeEach(function () {
        result = validate(invalidTypeVersion, simpleFormModel)
      })

      it('gives error message for invalid "version"', function () {
        expect(result.errors).to.containSubset([{
          path: '#/version',
          message: 'No enum match for: 0.1'
        }])
      })

      it('gives error message for invalid "type"', function () {
        expect(result.errors).to.containSubset([{
          path: '#/type',
          message: 'No enum match for: my-custom-type'
        }])
      })
    })

    it('does not complain when multiple root cells', function () {
      const def = _.cloneDeep(multipleCells)
      result = validate(def, simpleFormModel)
      expect(result.errors.length).to.eql(0)
    })

    it('does not complain when transforms are present', function () {
      const def = _.cloneDeep(transforms)
      result = validate(def, simpleFormModel)
      expect(result.errors.length).to.eql(0)
    })

    describe('when cells are bad', function () {
      let def
      beforeEach(function () {
        def = _.cloneDeep(badCells)
      })

      it('when invalid "extends"', function () {
        def.cells = [def.cells[2]]
        result = validate(def, simpleFormModel)
        expect(result.errors).to.containSubset([{
          path: '#/cells/0',
          message: 'Invalid value "baz" for "extends" Valid options are ["bar","foo"]'
        }])
      })
    })

    describe('when modelType is invalid on root cell', function () {
      var result

      beforeEach(function () {
        const model = {
          properties: {
            foo: {
              type: 'string'
            }
          },
          type: 'object'
        }

        const view = {
          cells: [
            {
              model: 'foo',
              renderer: {
                name: 'select',
                options: {
                  modelType: 'bar'
                }
              }
            }
          ],
          type: 'form',
          version: '2.0'
        }

        const renderers = []

        function validateRenderer (rendererName) {
          return true
        }

        function validateModelType () {
          return false
        }

        result = validate(view, model, renderers, validateRenderer, validateModelType)
      })

      it('returns proper result', function () {
        expect(result).deep.equal({
          errors: [
            {
              message: 'Invalid modelType reference "bar"',
              path: '#/cells/0/renderer/options'
            }
          ],
          warnings: []
        })
      })
    })

    describe('when modelType is invalid on root cell child', function () {
      var result

      beforeEach(function () {
        const model = {
          properties: {
            foo: {
              type: 'string'
            }
          },
          type: 'object'
        }

        const view = {
          cells: [
            {
              children: [
                {
                  model: 'foo',
                  renderer: {
                    name: 'select',
                    options: {
                      modelType: 'bar'
                    }
                  }
                }
              ]
            }
          ],
          type: 'form',
          version: '2.0'
        }

        const renderers = []

        function validateRenderer (rendererName) {
          return true
        }

        function validateModelType () {
          return false
        }

        result = validate(view, model, renderers, validateRenderer, validateModelType)
      })

      it('returns proper result', function () {
        expect(result).deep.equal({
          errors: [
            {
              message: 'Invalid modelType reference "bar"',
              path: '#/cells/0/children/0/renderer/options'
            }
          ],
          warnings: []
        })
      })
    })
  })
})
