/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import TextareaAutosize from 'react-textarea-autosize';
import { Button, Form, Header, Icon, TextArea } from 'semantic-ui-react';
import { usePopup } from '../../../lib/popup';
import { Input } from '../../../lib/custom-ui';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import { useClosableModal, useForm, useNestedRef } from '../../../hooks';
import { isModifierKeyPressed } from '../../../utils/event-helpers';
import { ProjectTypes } from '../../../constants/Enums';
import { ProjectTypeIcons } from '../../../constants/Icons';
import SelectTypeStep from '../AddProjectModal/SelectTypeStep';

import styles from '../AddProjectModal/AddProjectModal.module.scss';

const AddProjectFromTemplateModal = React.memo(() => {
  const defaultType = useSelector(
    (state) => selectors.selectCurrentModal(state).params.defaultType,
  );

  const { data: defaultData, isSubmitting } = useSelector(selectors.selectProjectCreateForm);
  // const [templates, setTemplates] = useState([]);
  // const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  // const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const [data, handleFieldChange, setData] = useForm(() => ({
    type: ProjectTypes.PRIVATE,
    templateId: '',
    ...defaultData,
    ...(defaultType && {
      type: defaultType,
    }),
    name: 'Proces flipowy',
    description: 'Warszawska 97/2',
  }));

  const [nameFieldRef, handleNameFieldRef] = useNestedRef('inputRef');

  const handleSubmit = useCallback(() => {
    const cleanData = {
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
      type: data.type,
    };

    if (!cleanData.name) {
      return;
    }

    dispatch(
      entryActions.createProjectFromTemplate({
        templateId: 1,
        data: cleanData,
      }),
    );
  }, [dispatch, data]);

  const handleClose = useCallback(() => {
    dispatch(entryActions.closeModal());
  }, [dispatch]);

  const handleDescriptionKeyDown = useCallback(
    (event) => {
      if (isModifierKeyPressed(event) && event.key === 'Enter') {
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleTypeSelect = useCallback(
    (type) => {
      setData((prevData) => ({
        ...prevData,
        type,
      }));
    },
    [setData],
  );

  const [ClosableModal, , , closeModal] = useClosableModal();

  // useEffect(() => {
  //   const fetchTemplates = async () => {
  //     try {
  //       setIsLoadingTemplates(true);
  //       const { items } = await api.getTemplates();
  //       setTemplates(items || []);
  //     } catch (error) {
  //       console.error('Failed to fetch templates:', error);
  //     } finally {
  //       setIsLoadingTemplates(false);
  //     }
  //   };
  //
  //   fetchTemplates();
  // }, []);

  const handleSelectTypeClose = useCallback(() => {
    closeModal();
    nameFieldRef.current.focus();
  }, [closeModal, nameFieldRef]);

  useEffect(() => {
    nameFieldRef.current.focus();
  }, [nameFieldRef]);

  const SelectTypePopup = usePopup(SelectTypeStep, {
    onOpen: closeModal,
    onClose: handleSelectTypeClose,
  });

  return (
    <ClosableModal basic closeIcon size="tiny" onClose={handleClose}>
      <ClosableModal.Content>
        <Form onSubmit={handleSubmit}>
          <Header inverted size="huge">
            {t('action.createProjectFromTemplate', {
              context: 'title',
            })}
          </Header>
          <div className={styles.text}>{t('common.title')}</div>
          <Input
            fluid
            inverted
            ref={handleNameFieldRef}
            name="name"
            value={data.name}
            maxLength={128}
            readOnly={isSubmitting}
            className={styles.field}
            onChange={handleFieldChange}
          />
          <div className={styles.text}>{t('common.description')}</div>
          <TextArea
            as={TextareaAutosize}
            name="description"
            value={data.description}
            maxLength={1024}
            minRows={2}
            spellCheck={false}
            className={styles.field}
            onKeyDown={handleDescriptionKeyDown}
            onChange={handleFieldChange}
          />
          {/* <div className={styles.text}>{t('common.template')}</div> */}
          {/* <Form.Field> */}
          {/*  <label>{t('common.selectTemplate')}</label> */}
          {/*  <Dropdown */}
          {/*    fluid */}
          {/*    selection */}
          {/*    placeholder={isLoadingTemplates ? t('common.loading') : t('common.selectTemplate')} */}
          {/*    loading={isLoadingTemplates} */}
          {/*    disabled={isLoadingTemplates || isSubmitting} */}
          {/*    options={templates.map((template) => ({ */}
          {/*      key: template.id, */}
          {/*      value: template.id, */}
          {/*      text: template.name, */}
          {/*    }))} */}
          {/*    value={selectedTemplateId} */}
          {/*    onChange={(e, { value }) => setSelectedTemplateId(value)} */}
          {/*    required */}
          {/*  /> */}
          {/* </Form.Field> */}
          <Button
            inverted
            color="green"
            icon="checkmark"
            content={t('action.createProject')}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
          <SelectTypePopup value={data.type} onSelect={handleTypeSelect}>
            <Button type="button" className={styles.selectTypeButton}>
              <Icon name={ProjectTypeIcons[data.type]} className={styles.selectTypeButtonIcon} />
              {t(`common.${data.type}`)}
            </Button>
          </SelectTypePopup>
        </Form>
      </ClosableModal.Content>
    </ClosableModal>
  );
});

export default AddProjectFromTemplateModal;
