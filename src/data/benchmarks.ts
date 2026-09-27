import type { BenchmarkPreset } from '../types';

export const BENCHMARK_PRESETS: BenchmarkPreset[] = [
  {
    id: 'pcb-assembly',
    title: 'PCB Electronics Assembly & Soldering',
    industry: 'Electronics Manufacturing',
    description: 'Human operator picking SMD components, aligning with PCB pad, holding micro-soldering tool, and inspecting solder joints.',
    duration_sec: 48,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    data: {
      human_insights: {
        task_name: 'PCB Component Placement & Soldering Cycle',
        total_duration_seconds: 48,
        efficiency_score: 84,
        steps: [
          {
            step_number: 1,
            name: 'Reach & Select Component',
            start_time: 0,
            end_time: 7.5,
            duration: 7.5,
            category: 'setup',
            summary: 'Operator reaches to anti-static tray on right perimeter and pinches IC chip with precision tweezers.'
          },
          {
            step_number: 2,
            name: 'Precision Alignment on PCB',
            start_time: 7.5,
            end_time: 18.0,
            duration: 10.5,
            category: 'value_added',
            summary: 'Aligns micro-pins with solder pads under magnifier lamp.'
          },
          {
            step_number: 3,
            name: 'Solder Iron Heating & Feed',
            start_time: 18.0,
            end_time: 29.5,
            duration: 11.5,
            category: 'value_added',
            summary: 'Applies 350°C soldering tip to lead pads while feeding thin flux core wire.'
          },
          {
            step_number: 4,
            name: 'Searching for Inspection Loupe',
            start_time: 29.5,
            end_time: 39.0,
            duration: 9.5,
            category: 'non_value_added',
            summary: 'Operator pauses to search workbench for missing magnifying loupe.'
          },
          {
            step_number: 5,
            name: 'Optical Quality Inspection',
            start_time: 39.0,
            end_time: 48.0,
            duration: 9.0,
            category: 'inspection',
            summary: 'Inspects solder joints for bridges and cold solder joints.'
          }
        ],
        bottlenecks: [
          {
            id: 'btn-pcb-01',
            timestamp_range: '00:29 - 00:39',
            severity: 'high',
            impacted_step: 'Searching for Inspection Loupe',
            description: '9.5s wasted looking for un-shadowed inspection loupe on un-designated bench location.',
            root_cause: 'Lack of dedicated tool shadowboard for optical inspection gear.'
          },
          {
            id: 'btn-pcb-02',
            timestamp_range: '00:07 - 00:18',
            severity: 'medium',
            impacted_step: 'Precision Alignment on PCB',
            description: 'Micro-tweezer grasp slips twice due to smooth metal grip surface.',
            root_cause: 'Worn non-textured tweezer tips causing micro-tremors.'
          }
        ],
        improvement_suggestions: [
          {
            id: 'sug-pcb-01',
            category: '5S Workspace Design',
            title: 'Implement Magnetic Tool Shadowboard',
            description: 'Mount magnetic holder for loupe and tweezers directly in central vision cone. Saves ~9.5s per unit cycle.',
            estimated_time_saved_sec: 9.5
          },
          {
            id: 'sug-pcb-02',
            category: 'Tooling Upgrade',
            title: 'Ergonomic Rubberized Tweezers',
            description: 'Switch to ESD-safe rubber-padded grip tweezers to reduce alignment search micro-corrections by 3.5s.',
            estimated_time_saved_sec: 3.5
          }
        ]
      },
      robot_data: {
        dataset_id: 'ps_pcb_v1_001',
        timestamp_iso: '2026-09-27T10:15:00Z',
        task_type: 'PCB SMD Soldering',
        environment: 'ESD-Safe Workstation 4',
        video_metadata: {
          fps: 30,
          resolution: '1920x1080',
          total_frames: 1440
        },
        atomic_actions: [
          {
            action_id: 1,
            primitive: 'pick',
            start_sec: 1.0,
            end_sec: 5.5,
            target_object: 'precision_tweezers',
            secondary_object: 'component_tray',
            source_zone: 'right_rack',
            destination_zone: 'center_pcb',
            bounding_box_normalized: [150, 720, 380, 920],
            confidence_score: 0.96,
            grasp_type: 'pinch_precision',
            estimated_force: 'low'
          },
          {
            action_id: 2,
            primitive: 'pick',
            start_sec: 5.5,
            end_sec: 7.5,
            target_object: 'ic_chip_qfn32',
            source_zone: 'tray_slot_4',
            bounding_box_normalized: [220, 680, 310, 750],
            confidence_score: 0.93,
            grasp_type: 'tweezer_pinch'
          },
          {
            action_id: 3,
            primitive: 'move',
            start_sec: 7.5,
            end_sec: 12.0,
            target_object: 'ic_chip_qfn32',
            destination_zone: 'pcb_main_pad',
            bounding_box_normalized: [410, 420, 590, 580],
            confidence_score: 0.95
          },
          {
            action_id: 4,
            primitive: 'align',
            start_sec: 12.0,
            end_sec: 18.0,
            target_object: 'ic_chip_qfn32',
            secondary_object: 'pcb_solder_pads',
            bounding_box_normalized: [440, 460, 520, 540],
            confidence_score: 0.91
          },
          {
            action_id: 5,
            primitive: 'hold',
            start_sec: 18.0,
            end_sec: 29.5,
            target_object: 'soldering_iron_tip',
            secondary_object: 'solder_wire',
            bounding_box_normalized: [380, 480, 560, 620],
            confidence_score: 0.97,
            grasp_type: 'power_pencil',
            estimated_force: 'medium'
          },
          {
            action_id: 6,
            primitive: 'wait',
            start_sec: 29.5,
            end_sec: 39.0,
            target_object: 'human_hand_idle',
            bounding_box_normalized: [600, 200, 850, 450],
            confidence_score: 0.88
          },
          {
            action_id: 7,
            primitive: 'inspect',
            start_sec: 39.0,
            end_sec: 48.0,
            target_object: 'loupe_lens',
            secondary_object: 'solder_joint_array',
            bounding_box_normalized: [420, 450, 550, 580],
            confidence_score: 0.94
          }
        ]
      }
    }
  },
  {
    id: 'box-packing',
    title: 'E-Commerce Box Packing & Shipping Prep',
    industry: 'Logistics & Warehousing',
    description: 'Operator selecting cardboard box, folding flaps, inserting protective bubble wrap, scanning barcode, taping seam, and applying shipping label.',
    duration_sec: 52,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    poster: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    data: {
      human_insights: {
        task_name: 'Standard Parcel Fulfillment & Taping Line',
        total_duration_seconds: 52,
        efficiency_score: 76,
        steps: [
          {
            step_number: 1,
            name: 'Retrieve Flat Carton & Form Box',
            start_time: 0,
            end_time: 8.0,
            duration: 8.0,
            category: 'setup',
            summary: 'Pulls flat corrugated box, pops open geometry, folds bottom minor flaps.'
          },
          {
            step_number: 2,
            name: 'Bottom Seam Tape Application',
            start_time: 8.0,
            end_time: 17.5,
            duration: 9.5,
            category: 'value_added',
            summary: 'Uses manual tape dispenser to apply 2-inch acrylic tape across bottom seam.'
          },
          {
            step_number: 3,
            name: 'Item Placement & Dunnage Filling',
            start_time: 17.5,
            end_time: 31.0,
            duration: 13.5,
            category: 'value_added',
            summary: 'Inserts product item, adds 2 kraft paper void fill sheets, inserts packing slip.'
          },
          {
            step_number: 4,
            name: 'Taping Dispenser Jam Clearing',
            start_time: 31.0,
            end_time: 42.0,
            duration: 11.0,
            category: 'non_value_added',
            summary: 'Tape dispenser blade jammed; operator manually pulls adhesive tangle free.'
          },
          {
            step_number: 5,
            name: 'Label Printing & Final Staging',
            start_time: 42.0,
            end_time: 52.0,
            duration: 10.0,
            category: 'setup',
            summary: 'Scans barcode, prints thermal label, adheres label to top box face, pushes to roller conveyor.'
          }
        ],
        bottlenecks: [
          {
            id: 'btn-box-01',
            timestamp_range: '00:31 - 00:42',
            severity: 'critical',
            impacted_step: 'Taping Dispenser Jam Clearing',
            description: '11.0s lost due to adhesive roll binding on manual tape dispenser mechanism.',
            root_cause: 'Dull dispenser blade edge catching tape film.'
          }
        ],
        improvement_suggestions: [
          {
            id: 'sug-box-01',
            category: 'Equipment Maintenance',
            title: 'Auto-dispensing Water-Activated Tape Machine',
            description: 'Replace handheld tape guns with preset auto-cut dispenser. Eliminates tape jams and saves 11.0s per box.',
            estimated_time_saved_sec: 11.0
          },
          {
            id: 'sug-box-02',
            category: 'Ergonomics',
            title: 'Lower Dunnage Dispenser Overhead',
            description: 'Re-position kraft paper roll 30cm lower to avoid shoulder strain overhead reach.',
            estimated_time_saved_sec: 2.5
          }
        ]
      },
      robot_data: {
        dataset_id: 'ps_box_v1_002',
        timestamp_iso: '2026-09-27T11:00:00Z',
        task_type: 'Carton Assembly & Packing',
        environment: 'Packing Station Alpha',
        video_metadata: {
          fps: 30,
          resolution: '1920x1080',
          total_frames: 1560
        },
        atomic_actions: [
          {
            action_id: 1,
            primitive: 'pick',
            start_sec: 0.5,
            end_sec: 4.0,
            target_object: 'flat_carton_box',
            source_zone: 'pallet_rack',
            bounding_box_normalized: [100, 150, 750, 450],
            confidence_score: 0.97
          },
          {
            action_id: 2,
            primitive: 'press',
            start_sec: 4.0,
            end_sec: 8.0,
            target_object: 'carton_flaps',
            bounding_box_normalized: [300, 350, 650, 650],
            confidence_score: 0.92,
            grasp_type: 'dual_hand_fold'
          },
          {
            action_id: 3,
            primitive: 'move',
            start_sec: 8.0,
            end_sec: 17.5,
            target_object: 'tape_dispenser_gun',
            secondary_object: 'box_bottom_seam',
            bounding_box_normalized: [400, 300, 600, 700],
            confidence_score: 0.95
          },
          {
            action_id: 4,
            primitive: 'place',
            start_sec: 17.5,
            end_sec: 25.0,
            target_object: 'retail_item_box',
            destination_zone: 'carton_interior',
            bounding_box_normalized: [350, 400, 550, 600],
            confidence_score: 0.98
          },
          {
            action_id: 5,
            primitive: 'place',
            start_sec: 25.0,
            end_sec: 31.0,
            target_object: 'kraft_paper_dunnage',
            destination_zone: 'carton_void',
            bounding_box_normalized: [320, 380, 580, 620],
            confidence_score: 0.89
          },
          {
            action_id: 6,
            primitive: 'wait',
            start_sec: 31.0,
            end_sec: 42.0,
            target_object: 'jammed_tape_dispenser',
            bounding_box_normalized: [450, 250, 700, 550],
            confidence_score: 0.84
          },
          {
            action_id: 7,
            primitive: 'press',
            start_sec: 42.0,
            end_sec: 52.0,
            target_object: 'thermal_label_sticker',
            secondary_object: 'box_top_surface',
            bounding_box_normalized: [380, 420, 500, 540],
            confidence_score: 0.96
          }
        ]
      }
    }
  },
  {
    id: 'component-sorting',
    title: 'Industrial Hardware Sorting & Kitting',
    industry: 'Automotive Parts Assembly',
    description: 'Manual sorting of fasteners, bolts, and rubber grommets into compartmentalized kitting trays with visual verification.',
    duration_sec: 40,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    poster: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
    data: {
      human_insights: {
        task_name: 'Multi-part Fastener Kitting Sequence',
        total_duration_seconds: 40,
        efficiency_score: 91,
        steps: [
          {
            step_number: 1,
            name: 'Sort M8 Hex Bolts',
            start_time: 0,
            end_time: 11.0,
            duration: 11.0,
            category: 'value_added',
            summary: 'Picks 4x M8 bolts from central bin, places into Tray Slot A.'
          },
          {
            step_number: 2,
            name: 'Sort Rubber Sealing Washers',
            start_time: 11.0,
            end_time: 21.5,
            duration: 10.5,
            category: 'value_added',
            summary: 'Picks 4x rubber washers, slides over bolt shafts.'
          },
          {
            step_number: 3,
            name: 'Sort M8 Flange Nuts',
            start_time: 21.5,
            end_time: 32.0,
            duration: 10.5,
            category: 'value_added',
            summary: 'Picks 4x matching flange nuts, places into Tray Slot B.'
          },
          {
            step_number: 4,
            name: 'Kit Count Verification & Latching',
            start_time: 32.0,
            end_time: 40.0,
            duration: 8.0,
            category: 'inspection',
            summary: 'Visually verifies part count per slot, closes plastic lid latch.'
          }
        ],
        bottlenecks: [
          {
            id: 'btn-sort-01',
            timestamp_range: '00:11 - 00:16',
            severity: 'low',
            impacted_step: 'Sort Rubber Sealing Washers',
            description: 'Rubber washers sticking together due to static friction.',
            root_cause: 'Lack of anti-static coating in supply bin.'
          }
        ],
        improvement_suggestions: [
          {
            id: 'sug-sort-01',
            category: 'Material Handling',
            title: 'Vibratory Bin Feeder',
            description: 'Introduce small vibratory bowl feeder to separate sticky rubber washers before picking.',
            estimated_time_saved_sec: 4.0
          }
        ]
      },
      robot_data: {
        dataset_id: 'ps_sort_v1_003',
        timestamp_iso: '2026-09-27T11:30:00Z',
        task_type: 'Fastener Kitting & Sorting',
        environment: 'Kitting Cell 02',
        video_metadata: {
          fps: 30,
          resolution: '1920x1080',
          total_frames: 1200
        },
        atomic_actions: [
          {
            action_id: 1,
            primitive: 'pick',
            start_sec: 0.5,
            end_sec: 5.5,
            target_object: 'm8_hex_bolt',
            source_zone: 'bulk_bin_bolts',
            bounding_box_normalized: [200, 300, 400, 450],
            confidence_score: 0.98
          },
          {
            action_id: 2,
            primitive: 'place',
            start_sec: 5.5,
            end_sec: 11.0,
            target_object: 'm8_hex_bolt',
            destination_zone: 'kitting_tray_slot_a',
            bounding_box_normalized: [500, 600, 700, 750],
            confidence_score: 0.96
          },
          {
            action_id: 3,
            primitive: 'pick',
            start_sec: 11.0,
            end_sec: 16.0,
            target_object: 'rubber_washer',
            source_zone: 'bulk_bin_washers',
            bounding_box_normalized: [220, 500, 380, 620],
            confidence_score: 0.92
          },
          {
            action_id: 4,
            primitive: 'align',
            start_sec: 16.0,
            end_sec: 21.5,
            target_object: 'rubber_washer',
            secondary_object: 'm8_hex_bolt',
            bounding_box_normalized: [510, 610, 690, 740],
            confidence_score: 0.94
          },
          {
            action_id: 5,
            primitive: 'pick',
            start_sec: 21.5,
            end_sec: 27.0,
            target_object: 'flange_nut',
            source_zone: 'bulk_bin_nuts',
            bounding_box_normalized: [250, 700, 420, 850],
            confidence_score: 0.95
          },
          {
            action_id: 6,
            primitive: 'place',
            start_sec: 27.0,
            end_sec: 32.0,
            target_object: 'flange_nut',
            destination_zone: 'kitting_tray_slot_b',
            bounding_box_normalized: [520, 760, 710, 890],
            confidence_score: 0.97
          },
          {
            action_id: 7,
            primitive: 'press',
            start_sec: 32.0,
            end_sec: 40.0,
            target_object: 'tray_lid_latch',
            bounding_box_normalized: [480, 580, 750, 900],
            confidence_score: 0.99
          }
        ]
      }
    }
  },
  {
    id: 'tool-repair',
    title: 'Cordless Tool Teardown & Motor Repair',
    industry: 'Maintenance & Aftermarket Repair',
    description: 'Technician removing hex screws from cordless drill shell, opening housing, extracting armature motor, and inspecting carbon brushes.',
    duration_sec: 65,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    poster: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    data: {
      human_insights: {
        task_name: 'Cordless Drill Housing Teardown & Inspection',
        total_duration_seconds: 65,
        efficiency_score: 79,
        steps: [
          {
            step_number: 1,
            name: 'Remove Housing Fasteners (6x Screws)',
            start_time: 0,
            end_time: 22.0,
            duration: 22.0,
            category: 'value_added',
            summary: 'Unscrews 6x Torx T10 casing screws using electric driver.'
          },
          {
            step_number: 2,
            name: 'Pry Clamshell Housing Halves',
            start_time: 22.0,
            end_time: 33.5,
            duration: 11.5,
            category: 'value_added',
            summary: 'Inserts plastic spudger into seam, pops casing clips apart.'
          },
          {
            step_number: 3,
            name: 'Stuck Armature Extraction',
            start_time: 33.5,
            end_time: 49.0,
            duration: 15.5,
            category: 'non_value_added',
            summary: 'Motor bearing seized in housing seat; technician wiggles forcefully to release.'
          },
          {
            step_number: 4,
            name: 'Brush Wear Measurement',
            start_time: 49.0,
            end_time: 65.0,
            duration: 16.0,
            category: 'inspection',
            summary: 'Measures remaining carbon brush length with digital vernier caliper.'
          }
        ],
        bottlenecks: [
          {
            id: 'btn-rep-01',
            timestamp_range: '00:33 - 00:49',
            severity: 'high',
            impacted_step: 'Stuck Armature Extraction',
            description: '15.5s delay pulling motor assembly due to mechanical interference fit in lower plastic housing.',
            root_cause: 'Lack of dedicated bearing puller fixture.'
          }
        ],
        improvement_suggestions: [
          {
            id: 'sug-rep-01',
            category: 'Specialized Fixturing',
            title: 'Levered Casing Separation Fixture',
            description: 'Use a bench-mounted lever clip press to separate housing and push motor out in single 2s motion.',
            estimated_time_saved_sec: 13.5
          }
        ]
      },
      robot_data: {
        dataset_id: 'ps_rep_v1_004',
        timestamp_iso: '2026-09-27T11:45:00Z',
        task_type: 'Tool Disassembly & Motor Repair',
        environment: 'Repair Bay 03',
        video_metadata: {
          fps: 30,
          resolution: '1920x1080',
          total_frames: 1950
        },
        atomic_actions: [
          {
            action_id: 1,
            primitive: 'hold',
            start_sec: 0.5,
            end_sec: 22.0,
            target_object: 'electric_screwdriver',
            secondary_object: 'drill_housing_screw',
            bounding_box_normalized: [300, 350, 600, 650],
            confidence_score: 0.96
          },
          {
            action_id: 2,
            primitive: 'pick',
            start_sec: 22.0,
            end_sec: 27.0,
            target_object: 'spudger_pry_tool',
            bounding_box_normalized: [200, 700, 400, 850],
            confidence_score: 0.91
          },
          {
            action_id: 3,
            primitive: 'press',
            start_sec: 27.0,
            end_sec: 33.5,
            target_object: 'spudger_pry_tool',
            secondary_object: 'casing_seam',
            bounding_box_normalized: [350, 400, 550, 600],
            confidence_score: 0.94
          },
          {
            action_id: 4,
            primitive: 'hold',
            start_sec: 33.5,
            end_sec: 49.0,
            target_object: 'brushed_motor_armature',
            secondary_object: 'drill_casing_seat',
            bounding_box_normalized: [380, 420, 650, 680],
            confidence_score: 0.87
          },
          {
            action_id: 5,
            primitive: 'pick',
            start_sec: 49.0,
            end_sec: 55.0,
            target_object: 'digital_caliper',
            bounding_box_normalized: [150, 200, 350, 400],
            confidence_score: 0.97
          },
          {
            action_id: 6,
            primitive: 'inspect',
            start_sec: 55.0,
            end_sec: 65.0,
            target_object: 'carbon_brush_assembly',
            secondary_object: 'digital_caliper',
            bounding_box_normalized: [400, 450, 580, 620],
            confidence_score: 0.93
          }
        ]
      }
    }
  }
];
