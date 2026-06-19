import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Infinity as InfinityIcon, Plus, Repeat, Trash2, X } from "lucide-react";
import { useStore } from "../state/store";
import "./RosterPanel.css";

/** Slide-in glass drawer for managing the roster. */
export function RosterPanel() {
  const open = useStore((s) => s.rosterOpen);
  const roster = useStore((s) => s.roster);
  const mode = useStore((s) => s.mode);
  const cyclePicked = useStore((s) => s.cyclePicked);
  const addNames = useStore((s) => s.addNames);
  const removeName = useStore((s) => s.removeName);
  const clearRoster = useStore((s) => s.clearRoster);
  const toggleMode = useStore((s) => s.toggleMode);
  const closeRoster = useStore((s) => s.closeRoster);

  const [draft, setDraft] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const submit = () => {
    if (!draft.trim()) return;
    addNames(draft);
    setDraft("");
  };

  const onClearClick = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      window.setTimeout(() => setConfirmClear(false), 2600);
      return;
    }
    clearRoster();
    setConfirmClear(false);
  };

  const remaining = Math.max(roster.length - cyclePicked.length, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="roster-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeRoster}
          />
          <motion.aside
            className="roster-panel"
            initial={{ x: "104%" }}
            animate={{ x: 0 }}
            exit={{ x: "104%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className="roster-head">
              <div className="roster-title">
                名单
                <span className="roster-count">{roster.length}</span>
              </div>
              <button className="roster-x" onClick={closeRoster} aria-label="关闭">
                <X size={18} />
              </button>
            </div>

            <div className="roster-add">
              <textarea
                className="roster-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="输入或粘贴名字…&#10;支持换行 / 逗号 / 顿号分隔"
                rows={3}
              />
              <button className="roster-add-btn" onClick={submit} disabled={!draft.trim()}>
                <Plus size={16} />
                添加
              </button>
            </div>

            <button
              className={`roster-mode${mode === "noRepeat" ? " is-norepeat" : ""}`}
              onClick={toggleMode}
            >
              <span className="roster-mode-icon">
                {mode === "noRepeat" ? <Repeat size={16} /> : <InfinityIcon size={17} />}
              </span>
              <span className="roster-mode-text">
                <strong>{mode === "noRepeat" ? "不重复" : "可重复"}</strong>
                <small>
                  {mode === "noRepeat"
                    ? `点完一轮再循环 · 本轮还剩 ${remaining}`
                    : "每次都可能被点到"}
                </small>
              </span>
              <span className="roster-mode-switch" data-on={mode === "noRepeat"} />
            </button>

            <div className="roster-list">
              <AnimatePresence initial={false}>
                {roster.map((p) => {
                  const picked = mode === "noRepeat" && cyclePicked.includes(p.id);
                  return (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 44 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className={`roster-item${picked ? " is-picked" : ""}`}
                    >
                      <span className="roster-item-name">{p.name}</span>
                      {picked && <span className="roster-item-tag">已点</span>}
                      <button
                        className="roster-item-x"
                        onClick={() => removeName(p.id)}
                        aria-label={`移除 ${p.name}`}
                      >
                        <X size={15} />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {roster.length === 0 && (
                <div className="roster-empty">名单空空如也 ✦ 在上方添加名字</div>
              )}
            </div>

            <button
              className={`roster-clear${confirmClear ? " is-armed" : ""}`}
              onClick={onClearClick}
              disabled={roster.length === 0}
            >
              <Trash2 size={15} />
              {confirmClear ? "再点一次确认清空" : "清空名单"}
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
