import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Kanban,
  FileText,
  Activity,
  Plus,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  FolderArchive,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldCheck,
  Cpu,
  AlertCircle
} from 'lucide-react';
import { soundFx } from '../services/soundFx';
import {
  subscribeProjectTasks,
  saveProjectTask
} from '../services/firebase';

export default function CollaborationsPage({ user }) {
  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' | 'files' | 'activity'
  const [selectedProjectId, setSelectedProjectId] = useState('proj_quantum_sensor');

  // Sample collaboration projects (clearly tagged as demo datasets when unauthenticated)
  const projects = useMemo(() => [
    {
      id: 'proj_quantum_sensor',
      name: 'Bio-Photonic Optical Scanner (v2.0)',
      stage: 'Engineering Prototype',
      isDemo: true,
      members: [
        { name: 'Dr. Elena Rostova', role: 'Patent Lead', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
        { name: 'Marcus Vance', role: 'Hardware Lead', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
        { name: 'Sarah Lin', role: 'Firmware Dev', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' }
      ]
    },
    {
      id: 'proj_cleantech_mesh',
      name: 'Modular Hyper-Filtration Grid',
      stage: 'BOM Optimization & Testing',
      isDemo: true,
      members: [
        { name: 'David Kim', role: 'Fluidics Engineer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
        { name: 'Amina Nour', role: 'Materials Scientist', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150' }
      ]
    }
  ], []);

  // Supporting tasks that back the milestone completion figures
  const projectTasksMap = useMemo(() => ({
    proj_quantum_sensor: [
      {
        id: 'task_qs_1',
        title: 'Optical Spectral Calibration Matrix & Lens Alignment',
        desc: 'Completed calibration benchmarks for multi-spectral photodiodes.',
        status: 'DONE',
        priority: 'HIGH',
        assignee: 'Dr. Elena Rostova',
        dueDate: 'Nov 14'
      },
      {
        id: 'task_qs_2',
        title: 'BOM Component Cost Benchmark & Supplier Lock',
        desc: 'Negotiated volume tiers for injection mold and optical lenses.',
        status: 'DONE',
        priority: 'LOW',
        assignee: 'Marcus Vance',
        dueDate: 'Nov 18'
      },
      {
        id: 'task_qs_3',
        title: 'Draft Provisional Patent Application Claims 1–12',
        desc: 'Formulate claims covering multi-spectral optical beam splitter.',
        status: 'DONE',
        priority: 'URGENT',
        assignee: 'Dr. Elena Rostova',
        dueDate: 'Nov 20'
      },
      {
        id: 'task_qs_4',
        title: 'Rapid SLA Chassis 3D Print Form-Factor Verification',
        desc: 'Form factor validated with internal lithium polymer battery envelope.',
        status: 'DONE',
        priority: 'MEDIUM',
        assignee: 'Marcus Vance',
        dueDate: 'Nov 22'
      },
      {
        id: 'task_qs_5',
        title: 'Low-Power Sleep Firmware Optimization',
        desc: 'Reduce standby current draw below 18 microamps in BLE sleep cycle.',
        status: 'IN_REVIEW',
        priority: 'MEDIUM',
        assignee: 'Sarah Lin',
        dueDate: 'Nov 30'
      },
      {
        id: 'task_qs_6',
        title: 'CNC Housing Tolerances & Snap-Fit Verification',
        desc: 'Verify clearance fit for the primary injection chassis and battery clip.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assignee: 'Marcus Vance',
        dueDate: 'Dec 4'
      }
    ],
    proj_cleantech_mesh: [
      {
        id: 'task_cm_1',
        title: 'Graphene Mesh Porosity & Pressure Drop Simulation',
        desc: 'Computational fluid dynamics completed at 2.4 bar pressure.',
        status: 'DONE',
        priority: 'HIGH',
        assignee: 'David Kim',
        dueDate: 'Nov 10'
      },
      {
        id: 'task_cm_2',
        title: 'Ceramic Membrane Sintering Temperature Tests',
        desc: 'Verified micro-fracture resistance under 650°C thermal stress.',
        status: 'DONE',
        priority: 'MEDIUM',
        assignee: 'Amina Nour',
        dueDate: 'Nov 16'
      },
      {
        id: 'task_cm_3',
        title: 'Filter Housing Fast-Clamp Seal Analysis',
        desc: 'EPDM gasket compression test under cyclic hydrostatic pressure.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assignee: 'David Kim',
        dueDate: 'Nov 28'
      },
      {
        id: 'task_cm_4',
        title: 'BOM Cost Model & Industrial Scale Quoting',
        desc: 'Supplier quotes for extrusion tooling from regional fabricators.',
        status: 'TODO',
        priority: 'MEDIUM',
        assignee: 'Amina Nour',
        dueDate: 'Dec 2'
      },
      {
        id: 'task_cm_5',
        title: 'Field Pilot Water Quality Sensor Calibration',
        desc: 'Turbidity and heavy metal sensor integration with IoT gateway.',
        status: 'TODO',
        priority: 'LOW',
        assignee: 'David Kim',
        dueDate: 'Dec 10'
      }
    ]
  }), []);

  const defaultTasks = useMemo(() => {
    return projectTasksMap[selectedProjectId] || projectTasksMap.proj_quantum_sensor;
  }, [projectTasksMap, selectedProjectId]);

  // Initialize with supporting tasks so columns are never empty on initial load
  const [tasks, setTasks] = useState(defaultTasks);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Marcus Vance');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // Dynamically compute progress directly from actual board tasks
  const doneTasksCount = tasks.filter(t => t.status === 'DONE').length;
  const totalTasksCount = tasks.length;
  const computedProgress = totalTasksCount > 0 ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0;

  // Subscribe to real-time project tasks if authenticated, otherwise use sample demo tasks
  useEffect(() => {
    let unsubscribe = () => {};
    if (selectedProjectId && user?.id) {
      unsubscribe = subscribeProjectTasks(selectedProjectId, (cloudTasks) => {
        if (cloudTasks && cloudTasks.length > 0) {
          setTasks(cloudTasks);
        } else {
          setTasks(defaultTasks);
        }
      });
    } else {
      setTasks(defaultTasks);
    }
    return () => unsubscribe();
  }, [selectedProjectId, defaultTasks, user]);

  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const columns = [
    { key: 'TODO', title: 'To Do', color: 'gray' },
    { key: 'IN_PROGRESS', title: 'In Progress', color: 'blue' },
    { key: 'IN_REVIEW', title: 'In Review', color: 'purple' },
    { key: 'DONE', title: 'Completed', color: 'green' }
  ];

  const moveTask = async (task, targetStatus) => {
    soundFx.playTap();
    const updated = tasks.map(t => t.id === task.id ? { ...t, status: targetStatus } : t);
    setTasks(updated);

    if (targetStatus === 'DONE') {
      soundFx.playSuccess();
    }

    await saveProjectTask(selectedProjectId, {
      ...task,
      status: targetStatus
    }).catch(() => {});
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    soundFx.playTap();
    const taskObj = {
      id: `task_${Date.now()}`,
      title: newTaskTitle.trim(),
      desc: newTaskDesc.trim(),
      status: 'TODO',
      priority: newTaskPriority,
      assignee: newTaskAssignee,
      dueDate: newTaskDueDate || 'Upcoming'
    };

    setTasks(prev => [...prev, taskObj]);
    setShowAddTaskModal(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
    soundFx.playSuccess();

    await saveProjectTask(selectedProjectId, taskObj).catch(() => {});
  };

  // Files data
  const projectFiles = [
    { name: 'Scanner_Assembly_v2.0_Master.step', format: 'STEP (ISO 10303)', size: '14.2 MB', updated: '2d ago', uploader: 'Marcus Vance' },
    { name: 'Optical_Sensor_PCB_Gerber_Rev3.zip', format: 'Altium Gerber PCBA', size: '4.8 MB', updated: 'Yesterday', uploader: 'Sarah Lin' },
    { name: 'Provisional_Patent_Draft_Claims_v1.pdf', format: 'Legal PDF Memo', size: '1.9 MB', updated: 'Today', uploader: 'Dr. Elena Rostova' },
    { name: 'BOM_Component_Pricing_Matrix_2026.xlsx', format: 'Excel Financials', size: '820 KB', updated: '3d ago', uploader: 'Marcus Vance' }
  ];

  // Activities data
  const activities = [
    { id: 'a1', actor: 'Dr. Elena Rostova', action: 'Uploaded new legal draft', target: 'Provisional_Patent_Draft_Claims_v1.pdf', time: '2 hours ago' },
    { id: 'a2', actor: 'Sarah Lin', action: 'Moved task to In Review', target: 'Low-Power Sleep Firmware Optimization', time: '5 hours ago' },
    { id: 'a3', actor: 'Marcus Vance', action: 'Marked milestone completed', target: 'BOM Component Cost Benchmark', time: 'Yesterday' },
    { id: 'a4', actor: 'You', action: 'Invited a new collaborator', target: 'Sarah Lin (Firmware Dev)', time: '3 days ago' }
  ];

  return (
    <div className="collaborations-page-container">
      {/* Demo Alert Banner for Logged-Out Visitors */}
      {!user && (
        <div className="container" style={{ paddingTop: '20px', paddingBottom: '0' }}>
          <div className="demo-mode-alert-banner">
            <div className="demo-mode-alert-info">
              <AlertCircle size={17} className="text-amber flex-shrink-0" />
              <span>
                <strong>Demo Preview Workspace:</strong> You are viewing a simulated sample project and Kanban sprint board. Personal venture workspaces and team permissions require an authenticated account.
              </span>
            </div>
            <Link to="/login" className="btn btn-secondary btn-xs demo-auth-link">
              Log In to Collaborate
            </Link>
          </div>
        </div>
      )}

      {/* Project Top Bar */}
      <section className="collab-hero-header">
        <div className="container">
          {/* Project Switcher */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Select Venture:
            </span>
            {projects.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  soundFx.playTap();
                  setSelectedProjectId(p.id);
                }}
                style={{
                  background: selectedProjectId === p.id ? 'rgba(84, 230, 245, 0.15)' : 'var(--panel2)',
                  borderColor: selectedProjectId === p.id ? 'var(--cyan)' : 'var(--line)',
                  color: selectedProjectId === p.id ? 'var(--cyan)' : 'var(--text)',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: selectedProjectId === p.id ? 700 : 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{p.name}</span>
                {p.isDemo && <span className="demo-tag-pill" style={{ fontSize: '8.5px', padding: '1px 4px' }}>DEMO</span>}
              </button>
            ))}
          </div>

          <div className="collab-header-flex">
            <div>
              <div className="eyebrow-badge">
                <Kanban size={14} className="text-cyan mr-1" />
                <span>COLLABORATIVE VENTURE WORKSPACE</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', margin: '4px 0 10px' }}>
                <h1 className="collab-title" style={{ margin: 0 }}>{currentProject.name}</h1>
                {!user && <span className="demo-tag-pill">DEMO DATA</span>}
              </div>
              <div className="collab-meta-row">
                <span className="collab-stage-badge">{currentProject.stage}</span>
                <span className="collab-progress-text">
                  <b>{computedProgress}%</b> Milestone Completion ({doneTasksCount}/{totalTasksCount} Tasks Done)
                </span>
                <div className="collab-progress-bar">
                  <div className="collab-progress-fill" style={{ width: `${computedProgress}%` }} />
                </div>
              </div>
            </div>

            <div className="collab-header-right">
              <div className="team-roster-pill">
                <Users size={16} className="text-cyan mr-2" />
                <div className="member-avatars-stack">
                  {currentProject.members.map((m, idx) => (
                    <img key={idx} src={m.avatar} alt={m.name} className="roster-avatar" title={`${m.name} (${m.role})`} />
                  ))}
                </div>
                <span className="member-count-text">{currentProject.members.length} Collaborators</span>
              </div>

              <button
                className="btn btn-primary small add-task-trigger"
                onClick={() => {
                  soundFx.playTap();
                  setShowAddTaskModal(true);
                }}
              >
                <Plus size={16} /> Add Task
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="collab-tabs-bar">
            <button
              className={`collab-tab-btn ${activeTab === 'kanban' ? 'active' : ''}`}
              onClick={() => { soundFx.playTap(); setActiveTab('kanban'); }}
            >
              <Kanban size={15} /> Kanban Board
            </button>
            <button
              className={`collab-tab-btn ${activeTab === 'files' ? 'active' : ''}`}
              onClick={() => { soundFx.playTap(); setActiveTab('files'); }}
            >
              <FileText size={15} /> File Vault ({projectFiles.length})
            </button>
            <button
              className={`collab-tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => { soundFx.playTap(); setActiveTab('activity'); }}
            >
              <Activity size={15} /> Activity Timeline
            </button>
          </div>
        </div>
      </section>

      {/* Main Workspace Body */}
      <section className="collab-main-section">
        <div className="container">
          {activeTab === 'kanban' && (
            <div className="kanban-board-grid">
              {columns.map(col => {
                const colTasks = tasks.filter(t => t.status === col.key);
                return (
                  <div className="kanban-column-card" key={col.key}>
                    <div className="column-header">
                      <div className="column-title-box">
                        <span className={`column-dot dot-${col.color}`} />
                        <h3>{col.title}</h3>
                      </div>
                      <span className="column-count-badge">{colTasks.length}</span>
                    </div>

                    <div className="column-task-list">
                      {colTasks.length === 0 ? (
                        <div className="empty-column-drop">No tasks in this stage</div>
                      ) : (
                        colTasks.map(t => {
                          const priorityClass = `priority-${t.priority.toLowerCase()}`;
                          return (
                            <div className="task-card" key={t.id}>
                              <div className="task-card-top">
                                <span className={`task-priority-tag ${priorityClass}`}>
                                  {t.priority}
                                </span>
                                <span className="task-due-date">
                                  <Clock size={12} className="mr-1" /> {t.dueDate}
                                </span>
                              </div>

                              <h4 className="task-title">{t.title}</h4>
                              {t.desc && <p className="task-desc">{t.desc}</p>}

                              <div className="task-card-footer">
                                <div className="task-assignee">
                                  <div className="assignee-avatar">
                                    {t.assignee.slice(0, 1)}
                                  </div>
                                  <span className="assignee-name">{t.assignee}</span>
                                </div>

                                <div className="task-move-actions">
                                  {col.key === 'TODO' && (
                                    <button
                                      className="move-btn"
                                      onClick={() => moveTask(t, 'IN_PROGRESS')}
                                      title="Start working on this task"
                                    >
                                      <span>In Progress</span> <ArrowRight size={13} />
                                    </button>
                                  )}
                                  {col.key === 'IN_PROGRESS' && (
                                    <>
                                      <button
                                        className="move-btn back"
                                        onClick={() => moveTask(t, 'TODO')}
                                        title="Move back"
                                      >
                                        <ArrowLeft size={13} />
                                      </button>
                                      <button
                                        className="move-btn"
                                        onClick={() => moveTask(t, 'IN_REVIEW')}
                                        title="Submit for review"
                                      >
                                        <span>Review</span> <ArrowRight size={13} />
                                      </button>
                                    </>
                                  )}
                                  {col.key === 'IN_REVIEW' && (
                                    <>
                                      <button
                                        className="move-btn back"
                                        onClick={() => moveTask(t, 'IN_PROGRESS')}
                                        title="Needs revision"
                                      >
                                        <ArrowLeft size={13} />
                                      </button>
                                      <button
                                        className="move-btn complete"
                                        onClick={() => moveTask(t, 'DONE')}
                                        title="Approve and mark complete"
                                      >
                                        <CheckCircle size={13} /> Complete
                                      </button>
                                    </>
                                  )}
                                  {col.key === 'DONE' && (
                                    <span className="completed-badge">
                                      <CheckCircle size={14} className="text-emerald mr-1" /> Verified
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="files-vault-card">
              <div className="vault-header">
                <h3>
                  <FolderArchive size={20} className="text-cyan mr-2" />
                  Engineering Files & Protected CAD Vault
                </h3>
                <p>Version-controlled CAD assets, BOM pricing sheets, and patent claims.</p>
              </div>

              <div className="files-table-wrapper">
                <table className="files-table">
                  <thead>
                    <tr>
                      <th>FILE NAME</th>
                      <th>SPECIFICATION / FORMAT</th>
                      <th>SIZE</th>
                      <th>LAST UPDATED</th>
                      <th>UPLOADED BY</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectFiles.map((file, fIdx) => (
                      <tr key={fIdx}>
                        <td>
                          <div className="file-name-cell">
                            <FileText size={16} className="text-cyan mr-2" />
                            <b>{file.name}</b>
                          </div>
                        </td>
                        <td><span className="file-format-badge">{file.format}</span></td>
                        <td>{file.size}</td>
                        <td>{file.updated}</td>
                        <td>{file.uploader}</td>
                        <td>
                          <button
                            className="btn btn-outline small"
                            onClick={() => {
                              soundFx.playTap();
                              alert(`Downloading verified file: ${file.name}`);
                            }}
                          >
                            <Download size={14} /> Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-timeline-card">
              <div className="timeline-header">
                <h3>
                  <Activity size={20} className="text-cyan mr-2" />
                  Milestone & Task Audit Feed
                </h3>
              </div>

              <div className="timeline-feed">
                {activities.map(act => (
                  <div className="timeline-row" key={act.id}>
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <p>
                        <b>{act.actor}</b> {act.action} <i>“{act.target}”</i>
                      </p>
                      <span className="timeline-time">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="modal-overlay" onClick={() => setShowAddTaskModal(false)}>
          <div className="modal-box small-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Collaboration Task</h3>
              <button className="icon-btn small" onClick={() => setShowAddTaskModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="add-task-form">
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fabricate Injection Enclosure Batch 1"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Description / Technical Scope</label>
                <textarea
                  rows={3}
                  placeholder="Details, specs, tolerances, or links..."
                  value={newTaskDesc}
                  onChange={e => setNewTaskDesc(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Assignee</label>
                  <select
                    value={newTaskAssignee}
                    onChange={e => setNewTaskAssignee(e.target.value)}
                  >
                    {currentProject.members.map((m, idx) => (
                      <option key={idx} value={m.name}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="text"
                  placeholder="e.g. Dec 12 or Next Sprint"
                  value={newTaskDueDate}
                  onChange={e => setNewTaskDueDate(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline small"
                  onClick={() => setShowAddTaskModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary small">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
