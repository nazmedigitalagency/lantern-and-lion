'use client';

import Image from 'next/image';
import { useState } from 'react';
import type {
  ChoiceScene,
  DialogueScene,
  FinalChallengeScene,
  InteractiveStory,
  MemoryScene,
  NarrationScene,
  QuizQuestion,
  QuizScene,
  StoryScene,
  WorldKind,
} from './types';

function pick(kind: WorldKind, text: { child: string; teen: string }): string {
  return kind === 'teen' ? text.teen : text.child;
}

export function SceneShell({
  story,
  scene,
  kind,
  children,
}: {
  story: InteractiveStory;
  scene: StoryScene;
  kind: WorldKind;
  children: React.ReactNode;
}) {
  const total = story.scenes.length;
  return (
    <div key={scene.id} className="story-scene-enter" data-kind={kind}>
      <div className="story-progress-track" aria-hidden="true">
        {story.scenes.map((s) => (
          <span key={s.id} className={`story-progress-dot ${s.order <= scene.order ? 'filled' : ''}`} />
        ))}
      </div>
      <p style={{ textAlign: 'center', fontWeight: 800, color: 'var(--muted)', fontSize: 13, margin: '0 0 10px' }}>
        Scene {scene.order} of {total}
      </p>
      <div className="story-scene-card">
        {scene.illustration && (
          <div className="story-illustration-container">
            {scene.illustration.imageUrl ? (
              <div className="story-scene-image-wrapper">
                <Image
                  src={scene.illustration.imageUrl}
                  alt={scene.illustration.imageAlt || `Scene ${scene.order}`}
                  width={1280}
                  height={720}
                  priority={scene.order === 1}
                  className="story-scene-image"
                />
                <span className="story-scene-badge" aria-hidden="true">
                  {scene.illustration.emoji}
                </span>
              </div>
            ) : (
              <div className={`story-illustration ${scene.illustration.background ? `bg-${scene.illustration.background}` : ''}`} aria-hidden="true">
                {scene.illustration.emoji}
              </div>
            )}
          </div>
        )}
        {children}
        {scene.scripture && (
          <div className="story-scripture">
            <blockquote>&ldquo;{scene.scripture.text}&rdquo;</blockquote>
            <cite>
              📖 {scene.scripture.reference} ({scene.scripture.translation})
            </cite>
          </div>
        )}
      </div>
    </div>
  );
}

export function NarrationSceneView({
  story,
  scene,
  kind,
  onAdvance,
}: {
  story: InteractiveStory;
  scene: NarrationScene;
  kind: WorldKind;
  onAdvance: () => void;
}) {
  return (
    <SceneShell story={story} scene={scene} kind={kind}>
      <p className="story-text">{pick(kind, scene.text)}</p>
      <button type="button" className="button button-primary story-primary-action" onClick={onAdvance}>
        Continue →
      </button>
    </SceneShell>
  );
}

export function DialogueSceneView({
  story,
  scene,
  kind,
  onAdvance,
}: {
  story: InteractiveStory;
  scene: DialogueScene;
  kind: WorldKind;
  onAdvance: () => void;
}) {
  const speaker = story.characters.find((c) => c.id === scene.speakerId);
  return (
    <SceneShell story={story} scene={scene} kind={kind}>
      {speaker && (
        <span className="story-speaker">
          {speaker.emoji} {speaker.name}
        </span>
      )}
      <p className="story-text">{pick(kind, scene.line)}</p>
      <button type="button" className="button button-primary story-primary-action" onClick={onAdvance}>
        Continue →
      </button>
    </SceneShell>
  );
}

export function ChoiceSceneView({
  story,
  scene,
  kind,
  onChoose,
  onAdvance,
}: {
  story: InteractiveStory;
  scene: ChoiceScene;
  kind: WorldKind;
  onChoose: (choiceId: string) => void;
  onAdvance: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = scene.choices.find((c) => c.id === selectedId) || null;

  function handleSelect(choiceId: string) {
    setSelectedId(choiceId);
    onChoose(choiceId);
  }

  return (
    <SceneShell story={story} scene={scene} kind={kind}>
      <p className="story-text">{pick(kind, scene.prompt)}</p>
      <div className="story-choice-list" role="group" aria-label="Choose one">
        {scene.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            disabled={Boolean(selectedId)}
            className={`story-choice-btn ${choice.imageUrl ? 'has-img' : ''} ${selectedId === choice.id ? `selected ${choice.isBestChoice ? 'best' : 'not-best'}` : ''}`}
            onClick={() => handleSelect(choice.id)}
          >
            {choice.imageUrl && (
              <Image
                src={choice.imageUrl}
                alt=""
                width={56}
                height={56}
                className="story-choice-thumbnail"
                aria-hidden="true"
              />
            )}
            <span className="story-choice-text-wrap">{pick(kind, choice.label)}</span>
          </button>
        ))}
      </div>

      {selected && (
        <>
          <div className="story-feedback">{pick(kind, selected.feedback)}</div>
          {selected.bonusContent && (
            <div className="story-feedback bonus">
              {selected.bonusContent.emoji} {pick(kind, selected.bonusContent.text)}
            </div>
          )}
          <button type="button" className="button button-primary story-primary-action" onClick={onAdvance}>
            Continue →
          </button>
        </>
      )}
    </SceneShell>
  );
}

function QuizQuestionBlock({
  question,
  kind,
  onAnswered,
}: {
  question: QuizQuestion;
  kind: WorldKind;
  onAnswered: (correct: boolean) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <div style={{ marginBottom: 18 }}>
      <p className="story-text" style={{ fontSize: 17 }}>{pick(kind, question.prompt)}</p>
      <div className="story-quiz-options">
        {question.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = index === question.correctIndex;
          return (
            <button
              key={index}
              type="button"
              disabled={selectedIndex !== null}
              className={`story-choice-btn ${isSelected ? `selected ${isCorrect ? 'best' : 'not-best'}` : ''}`}
              onClick={() => {
                setSelectedIndex(index);
                onAnswered(isCorrect);
              }}
            >
              {pick(kind, option)}
            </button>
          );
        })}
      </div>
      {selectedIndex !== null && <div className="story-feedback">{pick(kind, question.explanation)}</div>}
    </div>
  );
}

export function QuizSceneView({
  story,
  scene,
  kind,
  onAnswer,
  onAdvance,
}: {
  story: InteractiveStory;
  scene: QuizScene;
  kind: WorldKind;
  onAnswer: (questionId: string, correct: boolean) => void;
  onAdvance: () => void;
}) {
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const allAnswered = answeredIds.length >= scene.questions.length;

  return (
    <SceneShell story={story} scene={scene} kind={kind}>
      {scene.questions.map((q) => (
        <QuizQuestionBlock
          key={q.id}
          question={q}
          kind={kind}
          onAnswered={(correct) => {
            onAnswer(q.id, correct);
            setAnsweredIds((prev) => (prev.includes(q.id) ? prev : [...prev, q.id]));
          }}
        />
      ))}
      {allAnswered && (
        <button type="button" className="button button-primary story-primary-action" onClick={onAdvance}>
          Continue →
        </button>
      )}
    </SceneShell>
  );
}

function fillBlanks(text: string, blanks: string[], revealed: boolean): React.ReactNode {
  if (revealed) return text;
  let result = text;
  blanks.forEach((blank) => {
    const re = new RegExp(blank, 'i');
    result = result.replace(re, '_____');
  });
  return result;
}

export function MemorySceneView({
  story,
  scene,
  kind,
  onAdvance,
}: {
  story: InteractiveStory;
  scene: MemoryScene;
  kind: WorldKind;
  onAdvance: () => void;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <SceneShell story={story} scene={scene} kind={kind}>
      <p className="story-text" style={{ fontSize: 16 }}>📜 Memory Verse — {scene.theme}</p>
      <div className="story-scripture">
        <blockquote>&ldquo;{fillBlanks(scene.verse.text, scene.blanks, revealed)}&rdquo;</blockquote>
        <cite>
          {scene.verse.reference} ({scene.verse.translation})
        </cite>
      </div>
      {!revealed ? (
        <button type="button" className="button button-secondary" onClick={() => setRevealed(true)} style={{ marginBottom: 12 }}>
          💡 Reveal the missing words
        </button>
      ) : null}
      <div>
        <button type="button" className="button button-primary story-primary-action" onClick={onAdvance}>
          Continue →
        </button>
      </div>
    </SceneShell>
  );
}

export function FinalChallengeSceneView({
  story,
  scene,
  kind,
  onAnswer,
  onFinish,
  correctCount,
}: {
  story: InteractiveStory;
  scene: FinalChallengeScene;
  kind: WorldKind;
  onAnswer: (questionId: string, correct: boolean) => void;
  onFinish: () => void;
  correctCount: number;
}) {
  const [attempt, setAttempt] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const allAnswered = answeredIds.length >= scene.questions.length;
  const passed = correctCount >= scene.requiredScore;

  return (
    <SceneShell story={story} scene={scene} kind={kind}>
      <p className="story-text" style={{ fontSize: 18 }}>🏆 {pick(kind, scene.title)}</p>
      {scene.questions.map((q) => (
        <QuizQuestionBlock
          key={`${q.id}-${attempt}`}
          question={q}
          kind={kind}
          onAnswered={(correct) => {
            onAnswer(q.id, correct);
            setAnsweredIds((prev) => (prev.includes(q.id) ? prev : [...prev, q.id]));
          }}
        />
      ))}
      {allAnswered && (
        <>
          <div className="story-feedback">
            {passed
              ? `Great work — you got ${correctCount} of ${scene.questions.length} right!`
              : `Good try! You got ${correctCount} of ${scene.questions.length}. Want to look back at the story and try once more?`}
          </div>
          {passed ? (
            <button type="button" className="button button-primary story-primary-action" onClick={onFinish}>
              Finish the story 🎉
            </button>
          ) : (
            <button
              type="button"
              className="button button-primary story-primary-action"
              onClick={() => {
                setAnsweredIds([]);
                setAttempt((a) => a + 1);
              }}
            >
              Try again
            </button>
          )}
        </>
      )}
    </SceneShell>
  );
}
