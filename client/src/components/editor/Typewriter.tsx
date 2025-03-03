import * as React from 'react'
import { useContext, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GameIdContext, InputModeContext, MonacoEditorContext, ProofContext } from '../../state/context'
import { useGetGameInfoQuery } from '../../state/api'

import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import '../../css/typewriter.css'
import * as monaco from 'monaco-editor'
import { useRpcSession } from '@leanprover/infoview'

/** The input field */
function TypewriterInput({disabled}: {disabled?: boolean}) {
  let { t } = useTranslation()
  const [typewriterInput, setTypewriterInput] = useState("") // React.useContext(InputModeContext)
  const {proof, setProof, interimDiags, setInterimDiags, setCrashed} = React.useContext(ProofContext)

  const inputRef = useRef()
  const [processing, setProcessing] = useState(false)
  const [oneLineEditor, setOneLineEditor] = useState<monaco.editor.IStandaloneCodeEditor>(null)

  /** Reference to the hidden multi-line editor */
  const editor = React.useContext(MonacoEditorContext)

  // const rpcSess = useRpcSession()

  /** Monaco editor requires the code to be set manually. */
  function setTypewriterContent (typewriterInput: string) {
    oneLineEditor?.getModel()?.setValue(typewriterInput)
    setTypewriterInput(typewriterInput)
  }

  // Run the command
  const runCommand = React.useCallback(() => {
    if (processing) {return}
    console.log('processing typewriter input')

    // // TODO: Desired logic is to only reset this after a new *error-free* command has been entered
    // setDeletedChat([])

    // const pos = editor.getPosition()
    const pos = editor.getModel().getFullModelRange().getEndPosition()

    // rpcSess.call('Game.test', pos).then((response) => {
    //   console.debug('test Rpc call worked')
    //   console.debug(response)
    // }).catch((err) => {
    //   console.error("failed")
    //   console.error(err)
    // })

    if (typewriterInput) {
      // setProcessing(true)
      editor.executeEdits("typewriter", [{
        range: monaco.Selection.fromPositions(
          pos,
          editor.getModel().getFullModelRange().getEndPosition()
        ),
        text: typewriterInput.trim() + "\n",
        forceMoveMarkers: false
      }])
      setTypewriterContent('')
      // // Load proof after executing edits
      // loadGoals(rpcSess, uri, setProof, setCrashed)
    }

    editor.setPosition(pos)
  }, [editor, typewriterInput])

  /*
  Keep `typewriterInput` up-to-date with editor content and
  ensure that our one-line editor can only have a single line
  */
  useEffect(() => {
    if (!oneLineEditor) {return}
    const l = oneLineEditor.onDidChangeModelContent(() => {
      const value = oneLineEditor.getValue()
      const valueClean = value.replace(/[\n\r]/g, '')
      setTypewriterInput(valueClean)
      if (value != valueClean) {
        oneLineEditor.setValue(valueClean)
      }
    })
    return () => {l.dispose()}
  }, [oneLineEditor])

  /* Set up `oneLineEditor` */
  useEffect(() => {
    const _editor = monaco.editor.create(inputRef.current!, {
      value: typewriterInput,
      language: "lean4cmd",
      quickSuggestions: false,
      lightbulb: {
        enabled: monaco.editor.ShowLightbulbIconMode.On
      },
      unicodeHighlight: {
          ambiguousCharacters: false,
      },
      automaticLayout: true,
      minimap: {
        enabled: false
      },
      lineNumbers: 'off',
      tabSize: 2,
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 0,
      'semanticHighlighting.enabled': true,
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      scrollbar: {
        vertical: 'hidden',
        horizontalScrollbarSize: 3
      },
      overviewRulerBorder: false,
      theme: 'vs-code-theme-converted',
      contextmenu: false
    })

    setOneLineEditor(_editor)

    // const config: AbbreviationConfig = {
    //   abbreviationCharacter: '\\',
    //   customTranslations: undefined,
    //   eagerReplacementEnabled: true
    // }
    // const provider = new AbbreviationProvider(config)
    // const abbrevRewriter = new AbbreviationRewriter(config, provider, editor.getModel())

    return () => {/*abbrevRewriter.dispose();*/ _editor.dispose()}
  }, [])

  /* Run command when pressing enter */
  useEffect(() => {
    if (!oneLineEditor) return
    const l = oneLineEditor.onKeyUp((ev) => {
      if (ev.code === "Enter") {
        runCommand()
      }
    })
    return () => { l.dispose() }
  }, [oneLineEditor, runCommand])

  /* Run command when pressing the button */
  const handleSubmit : React.FormEventHandler<HTMLFormElement> = (ev) => {
    ev.preventDefault()
    runCommand()
  }


  return <div className={`typewriter-cmd${proof?.completedWithWarnings ? ' hidden' : ''}${disabled ? ' disabled' : ''}`}>
    <form onSubmit={handleSubmit}>
      <div className="typewriter-input-wrapper">
        <div ref={inputRef} className="typewriter-input" />
      </div>
      <button type="submit" disabled={processing} className="btn btn-inverted">
        <FontAwesomeIcon icon={faWandMagicSparkles} />&nbsp;{t("Execute")}
      </button>
    </form>
  </div>
}


export function Typewriter() {
  let { t } = useTranslation()
  const {gameId, worldId, levelId} = useContext(GameIdContext)
  const editor = useContext(MonacoEditorContext)

  const model = editor.getModel()
  const uri = model.uri.toString()
  const gameInfo = useGetGameInfoQuery({game: gameId})

  return  <div className="typewriter">
    <TypewriterInput />
  </div>
}
